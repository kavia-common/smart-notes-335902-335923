import React, { useEffect } from "react";
import { act, render, screen } from "@testing-library/react";
import { useNotesStore } from "./useNotesStore";

/**
 * Test harness that exposes the hook output via a callback, and renders the
 * current filtered note titles to the DOM so we can assert on the user-visible output.
 */
function Harness({ onReady }) {
  const store = useNotesStore();

  useEffect(() => {
    onReady?.(store);
    // We intentionally want to refresh the reference if the store object identity changes.
  }, [store, onReady]);

  return (
    <div>
      <div data-testid="storage-available">{String(store.storageAvailable)}</div>
      <ul data-testid="filtered">
        {(store.filteredNotes || []).map((n) => (
          <li key={n.id}>{n.title}</li>
        ))}
      </ul>
    </div>
  );
}

describe("useNotesStore filtering + sorting", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("filters notes by search query across title/body/tags, and sorts by updatedAt desc", async () => {
    /** @type {any} */
    let storeRef = null;

    render(<Harness onReady={(s) => (storeRef = s)} />);

    // Create two notes
    await act(async () => {
      const id1 = storeRef.actions.createNote();
      storeRef.actions.updateNote(id1, { title: "Shopping list", body: "milk\neggs", tags: ["Personal"] });

      const id2 = storeRef.actions.createNote();
      storeRef.actions.updateNote(id2, { title: "Work plan", body: "Finish Q1 report", tags: ["work", "urgent"] });
    });

    // Initially: both notes show; note 2 should be first because it was updated last.
    const list1 = screen.getByTestId("filtered");
    expect(list1.textContent).toMatch(/Work plan/);
    expect(list1.textContent).toMatch(/Shopping list/);

    const itemsInitial = screen.getAllByRole("listitem");
    expect(itemsInitial[0]).toHaveTextContent("Work plan");
    expect(itemsInitial[1]).toHaveTextContent("Shopping list");

    // Search by body
    await act(async () => {
      storeRef.actions.setSearchQuery("report");
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("Work plan");

    // Search by tag substring (tags are included in query matching)
    await act(async () => {
      storeRef.actions.setSearchQuery("urg");
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("Work plan");

    // Search by title
    await act(async () => {
      storeRef.actions.setSearchQuery("shop");
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("Shopping list");

    // Clear query and filter by exact tag match (case-insensitive)
    await act(async () => {
      storeRef.actions.setSearchQuery("");
      storeRef.actions.setTagFilter("WORK");
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("Work plan");

    // Combine query + tag filter
    await act(async () => {
      storeRef.actions.setSearchQuery("plan");
      storeRef.actions.setTagFilter("work");
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("Work plan");

    // Non-matching tag should yield empty
    await act(async () => {
      storeRef.actions.setSearchQuery("");
      storeRef.actions.setTagFilter("nonexistent");
    });
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  test("deleting the selected note selects the next best-effort note (if any) and updates filtered list", async () => {
    /** @type {any} */
    let storeRef = null;

    render(<Harness onReady={(s) => (storeRef = s)} />);

    let id1 = null;
    let id2 = null;

    await act(async () => {
      id1 = storeRef.actions.createNote();
      storeRef.actions.updateNote(id1, { title: "First", body: "", tags: [] });

      id2 = storeRef.actions.createNote();
      storeRef.actions.updateNote(id2, { title: "Second", body: "", tags: [] });
    });

    // id2 is most recent and selected
    expect(storeRef.selectedId).toBe(id2);

    await act(async () => {
      storeRef.actions.deleteNote(id2);
    });

    // Should fall back to remaining note
    expect(storeRef.selectedId).toBe(id1);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent("First");

    await act(async () => {
      storeRef.actions.deleteNote(id1);
    });

    expect(storeRef.selectedId).toBe(null);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
