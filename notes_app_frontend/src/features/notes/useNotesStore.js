import { useCallback, useMemo, useState } from "react";
import { createNewNote, extractAllTags, normalizeTags, sortNotesByUpdatedDesc } from "./model";
import { isNotesStorageAvailable, loadNotesState } from "./notesStorage";

/**
 * PUBLIC_INTERFACE
 * useNotesStore
 *
 * Canonical notes state + actions flow for the app.
 *
 * Contract:
 * - Output:
 *   - notes: array
 *   - selectedId: string|null
 *   - selectedNote: object|null
 *   - filteredNotes: array
 *   - searchQuery: string
 *   - tagFilter: string
 *   - allTags: string[]
 *   - storageAvailable: boolean
 *   - actions: { createNote, selectNote, updateNote, deleteNote, setSearchQuery, setTagFilter }
 *
 * Invariants:
 * - notes are stored as an array of objects with at least {id, updatedAt}
 * - selectedId is either null or an id present in notes (best effort)
 */
export function useNotesStore() {
  const storageAvailable = isNotesStorageAvailable();
  const initial = storageAvailable ? loadNotesState() : { notes: [], selectedId: null };

  const [notes, setNotes] = useState(() => Array.isArray(initial.notes) ? initial.notes : []);
  const [selectedId, setSelectedId] = useState(() => (typeof initial.selectedId === "string" ? initial.selectedId : null));
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const selectedNote = useMemo(() => {
    if (!selectedId) return null;
    return (notes || []).find((n) => n.id === selectedId) || null;
  }, [notes, selectedId]);

  const allTags = useMemo(() => extractAllTags(notes), [notes]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tag = tagFilter.trim().toLowerCase();

    const filtered = (notes || []).filter((n) => {
      const title = String(n.title || "").toLowerCase();
      const body = String(n.body || "").toLowerCase();
      const tags = Array.isArray(n.tags) ? n.tags.map((t) => String(t).toLowerCase()) : [];

      const matchesQuery = !q || title.includes(q) || body.includes(q) || tags.some((t) => t.includes(q));
      const matchesTag = !tag || tags.includes(tag);
      return matchesQuery && matchesTag;
    });

    return sortNotesByUpdatedDesc(filtered);
  }, [notes, searchQuery, tagFilter]);

  const createNote = useCallback(() => {
    const note = createNewNote();
    setNotes((prev) => [note, ...(prev || [])]);
    setSelectedId(note.id);
    return note.id;
  }, []);

  const selectNote = useCallback((noteId) => {
    setSelectedId(noteId);
  }, []);

  const updateNote = useCallback((noteId, patch) => {
    const now = Date.now();
    setNotes((prev) => {
      const next = (prev || []).map((n) => {
        if (n.id !== noteId) return n;

        const nextTags =
          patch && Object.prototype.hasOwnProperty.call(patch, "tags")
            ? normalizeTags(patch.tags)
            : Array.isArray(n.tags)
              ? normalizeTags(n.tags)
              : [];

        return {
          ...n,
          ...patch,
          tags: nextTags,
          updatedAt: now,
        };
      });

      return next;
    });
  }, []);

  const deleteNote = useCallback((noteId) => {
    setNotes((prev) => (prev || []).filter((n) => n.id !== noteId));
    setSelectedId((prevSelectedId) => {
      if (prevSelectedId !== noteId) return prevSelectedId;

      // Pick a best-effort "next" note after deletion.
      const remaining = (notes || []).filter((n) => n.id !== noteId);
      const next = sortNotesByUpdatedDesc(remaining)[0];
      return next ? next.id : null;
    });
  }, [notes]);

  const actions = useMemo(() => {
    return {
      createNote,
      selectNote,
      updateNote,
      deleteNote,
      setSearchQuery,
      setTagFilter,
    };
  }, [createNote, selectNote, updateNote, deleteNote]);

  return {
    notes,
    selectedId,
    selectedNote,
    filteredNotes,
    searchQuery,
    tagFilter,
    allTags,
    storageAvailable,
    actions,
  };
}
