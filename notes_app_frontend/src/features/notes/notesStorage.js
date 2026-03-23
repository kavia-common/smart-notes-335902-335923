const NOTES_STORAGE_KEY = "smartNotes.notesState";
const SCHEMA_VERSION = 1;

/**
 * PUBLIC_INTERFACE
 * isNotesStorageAvailable
 *
 * Contract:
 * - Output: boolean indicating whether localStorage is usable (not blocked / quota / privacy mode)
 */
export function isNotesStorageAvailable() {
  try {
    const testKey = "__smartNotes_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * @typedef {Object} PersistedNotesStateV1
 * @property {number} version
 * @property {Array<Object>} notes
 * @property {string|null} selectedId
 */

/**
 * @typedef {Object} NotesState
 * @property {Array<Object>} notes
 * @property {string|null} selectedId
 */

/**
 * PUBLIC_INTERFACE
 * loadNotesState
 *
 * Loads notes state from localStorage with basic migration and safety checks.
 *
 * Contract:
 * - Output: NotesState (never throws; returns empty state on failure)
 * - Failure modes:
 *   - localStorage unavailable
 *   - invalid JSON
 *   - older schema versions
 */
export function loadNotesState() {
  if (!isNotesStorageAvailable()) {
    return { notes: [], selectedId: null };
  }

  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return { notes: [], selectedId: null };

    const parsed = JSON.parse(raw);

    // Migration path: previously stored as an array (version 0)
    if (Array.isArray(parsed)) {
      return { notes: parsed, selectedId: null };
    }

    // Versioned object
    if (parsed && typeof parsed === "object") {
      const version = typeof parsed.version === "number" ? parsed.version : 0;

      if (version === 0) {
        return {
          notes: Array.isArray(parsed.notes) ? parsed.notes : [],
          selectedId: typeof parsed.selectedId === "string" ? parsed.selectedId : null,
        };
      }

      if (version === SCHEMA_VERSION) {
        /** @type {PersistedNotesStateV1} */
        const v1 = parsed;
        return {
          notes: Array.isArray(v1.notes) ? v1.notes : [],
          selectedId: typeof v1.selectedId === "string" ? v1.selectedId : null,
        };
      }

      // Unknown future version: best-effort fallback
      return {
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        selectedId: typeof parsed.selectedId === "string" ? parsed.selectedId : null,
      };
    }

    return { notes: [], selectedId: null };
  } catch (err) {
    return { notes: [], selectedId: null };
  }
}

/**
 * PUBLIC_INTERFACE
 * saveNotesState
 *
 * Saves notes state to localStorage in a versioned structure.
 *
 * Contract:
 * - Inputs: NotesState
 * - Output: void
 * - Errors: throws if localStorage is not available or write fails
 */
export function saveNotesState(state) {
  if (!isNotesStorageAvailable()) {
    throw new Error("localStorage is not available in this environment.");
  }

  /** @type {PersistedNotesStateV1} */
  const toPersist = {
    version: SCHEMA_VERSION,
    notes: Array.isArray(state.notes) ? state.notes : [],
    selectedId: typeof state.selectedId === "string" ? state.selectedId : null,
  };

  window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(toPersist));
}

export { NOTES_STORAGE_KEY, SCHEMA_VERSION };
