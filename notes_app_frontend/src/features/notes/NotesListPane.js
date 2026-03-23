import React, { useCallback, useMemo, useRef } from "react";
import { getNotePreview, getNoteTitle } from "./model";

function formatDate(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch (e) {
    return "";
  }
}

/**
 * PUBLIC_INTERFACE
 * NotesListPane
 *
 * Contract:
 * - Props:
 *   - notes: Note[]
 *   - selectedId: string|null
 *   - searchQuery: string
 *   - tagFilter: string
 *   - allTags: string[]
 *   - onSearchQueryChange: (value: string) => void
 *   - onTagFilterChange: (value: string) => void
 *   - onSelectNote: (id: string) => void
 *   - onNewNote: () => void
 */
export default function NotesListPane({
  notes,
  selectedId,
  searchQuery,
  tagFilter,
  allTags,
  onSearchQueryChange,
  onTagFilterChange,
  onSelectNote,
  onNewNote,
}) {
  const listRef = useRef(null);

  const handleListKeyDown = useCallback((e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

    const listEl = listRef.current;
    if (!listEl) return;

    const buttons = Array.from(listEl.querySelectorAll("button[data-note-id]"));
    if (buttons.length === 0) return;

    const active = document.activeElement;
    const currentIndex = buttons.findIndex((b) => b === active);

    let nextIndex = currentIndex;
    if (e.key === "ArrowDown") nextIndex = Math.min(buttons.length - 1, Math.max(0, currentIndex) + 1);
    if (e.key === "ArrowUp") nextIndex = Math.max(0, currentIndex <= 0 ? 0 : currentIndex - 1);

    if (nextIndex !== currentIndex) {
      e.preventDefault();
      buttons[nextIndex].focus();
    }
  }, []);

  const emptyMessage = useMemo(() => {
    if (!notes || notes.length === 0) return "No notes yet. Create your first note to get started.";
    return "No matches. Try a different search or clear the tag filter.";
  }, [notes]);

  return (
    <section className="panel notesPane" aria-label="Notes list">
      <div className="panelHeader">
        <div className="panelHeaderRow">
          <h2 className="panelTitle">Notes</h2>
          <button className="btn btnPrimary" onClick={onNewNote}>
            New note
          </button>
        </div>

        <div className="filters" role="search">
          <div className="field">
            <label className="label" htmlFor="notes_search">
              Search
            </label>
            <input
              id="notes_search"
              className="input"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search title, content, or tags…"
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="notes_tag_filter">
              Tag filter (exact match)
            </label>
            <input
              id="notes_tag_filter"
              className="input"
              value={tagFilter}
              onChange={(e) => onTagFilterChange(e.target.value)}
              placeholder={allTags.length ? `Try: ${allTags.slice(0, 3).join(", ")}` : "e.g. work"}
              list="all_tags_list"
              autoComplete="off"
            />
            <datalist id="all_tags_list">
              {allTags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      <ul className="notesList" ref={listRef} onKeyDown={handleListKeyDown}>
        {(!notes || notes.length === 0) && (
          <li className="emptyState">
            <p className="emptyTitle">Nothing here yet</p>
            <p style={{ margin: 0 }}>{emptyMessage}</p>
          </li>
        )}

        {(notes || []).map((n) => {
          const title = getNoteTitle(n);
          const preview = getNotePreview(n);
          const isCurrent = selectedId === n.id;

          return (
            <li key={n.id}>
              <button
                type="button"
                className="noteItemBtn"
                data-note-id={n.id}
                aria-current={isCurrent ? "true" : "false"}
                onClick={() => onSelectNote(n.id)}
              >
                <div className="noteTitleRow">
                  <p className="noteTitle">{title}</p>
                  <span className="noteDate">{formatDate(n.updatedAt || n.createdAt)}</span>
                </div>
                <p className="notePreview">{preview}</p>
                {Array.isArray(n.tags) && n.tags.length > 0 && (
                  <div className="tagsRow" aria-label="Tags">
                    {n.tags.slice(0, 5).map((t) => (
                      <span className="tagPill" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
