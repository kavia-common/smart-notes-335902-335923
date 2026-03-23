import React, { useEffect, useMemo, useRef, useState } from "react";
import { getNoteTitle, normalizeTags } from "./model";

function formatTimestamp(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

/**
 * PUBLIC_INTERFACE
 * NoteEditor
 *
 * Contract:
 * - Props:
 *   - note: Note
 *   - onChange: (noteId: string, patch: Object) => void
 *   - onDelete: (noteId: string) => void
 */
export default function NoteEditor({ note, onChange, onDelete }) {
  const titleRef = useRef(null);
  const [tagsText, setTagsText] = useState(() => (Array.isArray(note.tags) ? note.tags.join(", ") : ""));

  // Keep tagsText in sync when changing notes.
  useEffect(() => {
    setTagsText(Array.isArray(note.tags) ? note.tags.join(", ") : "");
  }, [note.id]); // intentional: only on note switch

  // Focus title when editor mounts / note changes
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select?.();
    }
  }, [note.id]);

  const titleDisplay = useMemo(() => getNoteTitle(note), [note]);

  return (
    <div className="editorPane panel" aria-label="Note editor">
      <div className="editorTopRow">
        <div style={{ minWidth: 0 }}>
          <h2 className="editorTitle" title={titleDisplay}>
            Editing: {titleDisplay}
          </h2>
          <p className="metaText">
            Updated {formatTimestamp(note.updatedAt)} • Created {formatTimestamp(note.createdAt)}
          </p>
        </div>

        <div className="editorActions">
          <button className="btn btnDanger" onClick={() => onDelete(note.id)}>
            Delete
          </button>
        </div>
      </div>

      <div className="editorFields">
        <div className="field">
          <label className="label" htmlFor="note_title">
            Title
          </label>
          <input
            id="note_title"
            ref={titleRef}
            className="input"
            value={note.title}
            onChange={(e) => onChange(note.id, { title: e.target.value })}
            placeholder="Untitled"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="note_tags">
            Tags (comma-separated)
          </label>
          <input
            id="note_tags"
            className="input"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            onBlur={() => {
              const nextTags = normalizeTags(tagsText);
              onChange(note.id, { tags: nextTags });
              setTagsText(nextTags.join(", "));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const nextTags = normalizeTags(tagsText);
                onChange(note.id, { tags: nextTags });
                setTagsText(nextTags.join(", "));
              }
            }}
            placeholder="e.g. work, personal"
            autoComplete="off"
          />
          {Array.isArray(note.tags) && note.tags.length > 0 && (
            <div className="tagsRow" aria-label="Current tags" style={{ marginTop: 8 }}>
              {note.tags.map((t) => (
                <span className="tagPill" key={t}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="field" style={{ minHeight: 0 }}>
          <label className="label" htmlFor="note_body">
            Note
          </label>
          <textarea
            id="note_body"
            className="textarea"
            value={note.body}
            onChange={(e) => onChange(note.id, { body: e.target.value })}
            placeholder="Write your note here…"
          />
        </div>
      </div>
    </div>
  );
}
