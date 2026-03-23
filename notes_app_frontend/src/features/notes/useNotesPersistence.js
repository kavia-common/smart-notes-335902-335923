import { useEffect, useRef, useState } from "react";
import { saveNotesState } from "./notesStorage";
import { useDebouncedEffect } from "../../hooks/useDebouncedEffect";

/**
 * @typedef {"idle"|"saving"|"saved"|"error"|"disabled"} SaveState
 */

/**
 * @typedef {Object} SaveStatus
 * @property {SaveState} state
 * @property {number|null} savedAt
 * @property {string|null} errorMessage
 */

/**
 * PUBLIC_INTERFACE
 * useNotesPersistence
 *
 * Debounced autosave for notes state.
 *
 * Contract:
 * - Inputs:
 *   - notes: any[]
 *   - selectedId: string|null
 *   - enabled: boolean (if false, does not attempt to save)
 * - Output:
 *   - status: SaveStatus
 * - Side effects:
 *   - Writes to localStorage (debounced)
 */
export function useNotesPersistence({ notes, selectedId, enabled }) {
  const isFirstRun = useRef(true);
  const [status, setStatus] = useState(
    /** @type {SaveStatus} */ ({
      state: enabled ? "idle" : "disabled",
      savedAt: null,
      errorMessage: null,
    })
  );

  useEffect(() => {
    setStatus((prev) => ({
      ...prev,
      state: enabled ? (prev.state === "disabled" ? "idle" : prev.state) : "disabled",
      errorMessage: null,
    }));
  }, [enabled]);

  // Mark "saving" quickly on changes (but skip initial mount load).
  useEffect(() => {
    if (!enabled) return;
    if (isFirstRun.current) return;

    setStatus((prev) => ({
      ...prev,
      state: "saving",
      errorMessage: null,
    }));
  }, [notes, selectedId, enabled]);

  // Debounced write.
  useDebouncedEffect(
    () => {
      if (!enabled) return;

      // Skip initial mount load (we don't want to instantly rewrite storage)
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }

      try {
        saveNotesState({ notes, selectedId });
        setStatus({
          state: "saved",
          savedAt: Date.now(),
          errorMessage: null,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error while saving notes.";
        setStatus({
          state: "error",
          savedAt: null,
          errorMessage: message,
        });
      }
    },
    650,
    [notes, selectedId, enabled]
  );

  return { status };
}
