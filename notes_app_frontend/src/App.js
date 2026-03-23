import React, { useCallback, useMemo, useState } from "react";
import "./App.css";
import { useMediaQuery } from "./hooks/useMediaQuery";
import Modal from "./components/Modal";
import NotesListPane from "./features/notes/NotesListPane";
import NoteEditor from "./features/notes/NoteEditor";
import { useNotesStore } from "./features/notes/useNotesStore";
import { useNotesPersistence } from "./features/notes/useNotesPersistence";

function formatSavedAt(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

function getStatusText(status) {
  if (status.state === "disabled") return "Autosave disabled";
  if (status.state === "saving") return "Saving…";
  if (status.state === "saved") return status.savedAt ? `Saved ${formatSavedAt(status.savedAt)}` : "Saved";
  if (status.state === "error") return "Save failed";
  return "Ready";
}

// PUBLIC_INTERFACE
function App() {
  const isNarrow = useMediaQuery("(max-width: 900px)");
  const {
    selectedId,
    selectedNote,
    filteredNotes,
    searchQuery,
    tagFilter,
    allTags,
    storageAvailable,
    actions,
    notes,
  } = useNotesStore();

  const { status } = useNotesPersistence({
    notes,
    selectedId,
    enabled: storageAvailable,
  });

  const [isMobileEditorOpen, setMobileEditorOpen] = useState(false);

  const handleNewNote = useCallback(() => {
    const newId = actions.createNote();
    if (isNarrow) setMobileEditorOpen(true);
    return newId;
  }, [actions, isNarrow]);

  const handleSelectNote = useCallback(
    (id) => {
      actions.selectNote(id);
      if (isNarrow) setMobileEditorOpen(true);
    },
    [actions, isNarrow]
  );

  const handleDeleteNote = useCallback(
    (id) => {
      const ok = window.confirm("Delete this note? This cannot be undone.");
      if (!ok) return;
      actions.deleteNote(id);
      if (isNarrow) setMobileEditorOpen(false);
    },
    [actions, isNarrow]
  );

  const statusText = useMemo(() => getStatusText(status), [status]);

  const StatusDotClass = useMemo(() => {
    if (status.state === "saving") return "statusDot saving";
    if (status.state === "saved") return "statusDot saved";
    if (status.state === "error") return "statusDot error";
    return "statusDot";
  }, [status.state]);

  const EditorEmpty = (
    <div className="panel editorPane" aria-label="Note editor">
      <div className="emptyState">
        <p className="emptyTitle">Select a note to edit</p>
        <p style={{ margin: 0 }}>
          Choose a note from the list, or create a new one. Changes are autosaved locally.
        </p>
      </div>
    </div>
  );

  return (
    <div className="App">
      <a className="skipLink" href="#main">
        Skip to content
      </a>

      <header className="appHeader">
        <div className="headerInner">
          <div className="brand" aria-label="Smart Notes">
            <div className="brandMark" aria-hidden="true" />
            <div className="brandText">
              <h1 className="appTitle">Smart Notes</h1>
              <p className="appSubtitle">Local, fast, and autosaved</p>
            </div>
          </div>

          <div className="headerActions">
            <div className="statusPill" role="status" aria-live="polite">
              <span className={StatusDotClass} aria-hidden="true" />
              <span>{statusText}</span>
            </div>

            {!isNarrow && (
              <button className="btn btnPrimary" onClick={handleNewNote}>
                New note
              </button>
            )}
          </div>
        </div>
      </header>

      {!storageAvailable && (
        <div className="banner bannerWarn" role="status">
          Local storage is unavailable in this browser context. You can still use the app, but notes will not persist after reload.
        </div>
      )}

      {status.state === "error" && (
        <div className="banner bannerError" role="alert">
          Couldn’t save your notes. Your browser may be blocking storage or out of space. ({status.errorMessage || "Unknown error"})
        </div>
      )}

      <main id="main" className="appMain" tabIndex={-1}>
        <NotesListPane
          notes={filteredNotes}
          selectedId={selectedId}
          searchQuery={searchQuery}
          tagFilter={tagFilter}
          allTags={allTags}
          onSearchQueryChange={actions.setSearchQuery}
          onTagFilterChange={actions.setTagFilter}
          onSelectNote={handleSelectNote}
          onNewNote={handleNewNote}
        />

        {!isNarrow && (selectedNote ? (
          <NoteEditor note={selectedNote} onChange={actions.updateNote} onDelete={handleDeleteNote} />
        ) : (
          EditorEmpty
        ))}
      </main>

      <button className="fab" onClick={handleNewNote} aria-label="Create new note">
        +
      </button>

      <Modal
        isOpen={isNarrow && isMobileEditorOpen}
        title={selectedNote ? "Edit note" : "No note selected"}
        onClose={() => setMobileEditorOpen(false)}
      >
        {selectedNote ? (
          <NoteEditor note={selectedNote} onChange={actions.updateNote} onDelete={handleDeleteNote} />
        ) : (
          <div className="emptyState">
            <p className="emptyTitle">No note selected</p>
            <p style={{ margin: 0 }}>Select a note from the list, or create a new one.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;
