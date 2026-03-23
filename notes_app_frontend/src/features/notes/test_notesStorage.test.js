import { isNotesStorageAvailable, loadNotesState, saveNotesState, NOTES_STORAGE_KEY, SCHEMA_VERSION } from "./notesStorage";

describe("notesStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("isNotesStorageAvailable returns true when localStorage works", () => {
    expect(isNotesStorageAvailable()).toBe(true);
  });

  test("isNotesStorageAvailable returns false when localStorage throws", () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error("blocked");
    };

    try {
      expect(isNotesStorageAvailable()).toBe(false);
    } finally {
      window.localStorage.setItem = original;
    }
  });

  test("loadNotesState returns empty state when storage unavailable", () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error("blocked");
    };

    try {
      expect(loadNotesState()).toEqual({ notes: [], selectedId: null });
    } finally {
      window.localStorage.setItem = original;
    }
  });

  test("loadNotesState returns empty state when key is missing", () => {
    expect(loadNotesState()).toEqual({ notes: [], selectedId: null });
  });

  test("loadNotesState returns empty state when JSON is invalid", () => {
    window.localStorage.setItem(NOTES_STORAGE_KEY, "{not valid json");
    expect(loadNotesState()).toEqual({ notes: [], selectedId: null });
  });

  test("loadNotesState migrates legacy array (version 0) to {notes, selectedId:null}", () => {
    const legacy = [{ id: "n1", title: "T", body: "B", tags: [], createdAt: 1, updatedAt: 2 }];
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(legacy));

    expect(loadNotesState()).toEqual({ notes: legacy, selectedId: null });
  });

  test("loadNotesState reads versioned object (v1)", () => {
    const stored = {
      version: SCHEMA_VERSION,
      notes: [{ id: "n1", title: "hello", body: "", tags: ["work"], createdAt: 1, updatedAt: 2 }],
      selectedId: "n1",
    };
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(stored));

    expect(loadNotesState()).toEqual({ notes: stored.notes, selectedId: "n1" });
  });

  test("loadNotesState gracefully handles unknown future versions via best-effort fallback", () => {
    const stored = {
      version: 999,
      notes: [{ id: "n1" }],
      selectedId: "n1",
    };
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(stored));

    expect(loadNotesState()).toEqual({ notes: stored.notes, selectedId: "n1" });
  });

  test("saveNotesState persists a versioned structure", () => {
    const state = {
      notes: [{ id: "n1", title: "A", body: "B", tags: ["x"], createdAt: 1, updatedAt: 1 }],
      selectedId: "n1",
    };

    saveNotesState(state);

    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw);
    expect(parsed).toEqual({
      version: SCHEMA_VERSION,
      notes: state.notes,
      selectedId: state.selectedId,
    });
  });

  test("saveNotesState throws when storage is unavailable", () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error("blocked");
    };

    try {
      expect(() =>
        saveNotesState({
          notes: [],
          selectedId: null,
        })
      ).toThrow(/localStorage is not available/i);
    } finally {
      window.localStorage.setItem = original;
    }
  });
});
