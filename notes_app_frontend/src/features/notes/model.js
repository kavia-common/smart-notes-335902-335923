/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} body
 * @property {string[]} tags
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * PUBLIC_INTERFACE
 * createId
 *
 * Contract:
 * - Output: string unique id (uses crypto.randomUUID when available)
 */
export function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: reasonably unique for local use (time + random)
  return `note_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * PUBLIC_INTERFACE
 * normalizeTags
 *
 * Contract:
 * - Input: string[] or string (comma-separated)
 * - Output: string[] normalized, de-duplicated, lowercased
 */
export function normalizeTags(value) {
  const arr = Array.isArray(value) ? value : String(value || "").split(",");
  const normalized = arr
    .map((t) => String(t).trim())
    .filter(Boolean)
    .map((t) => t.toLowerCase());

  return Array.from(new Set(normalized));
}

/**
 * PUBLIC_INTERFACE
 * createNewNote
 *
 * Contract:
 * - Inputs: optional partial overrides
 * - Output: Note
 */
export function createNewNote(overrides = {}) {
  const now = Date.now();
  /** @type {Note} */
  const note = {
    id: createId(),
    title: "",
    body: "",
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  note.tags = normalizeTags(note.tags);
  return note;
}

/**
 * PUBLIC_INTERFACE
 * getNoteTitle
 *
 * Contract:
 * - Input: Note
 * - Output: string (never empty; returns "Untitled" for empty)
 */
export function getNoteTitle(note) {
  const title = String(note?.title || "").trim();
  return title.length > 0 ? title : "Untitled";
}

/**
 * PUBLIC_INTERFACE
 * getNotePreview
 *
 * Contract:
 * - Input: Note
 * - Output: string short preview for list display
 */
export function getNotePreview(note) {
  const body = String(note?.body || "").trim();
  if (!body) return "No content yet. Start writing…";
  const firstLine = body.split("\n").map((s) => s.trim()).find(Boolean) || body;
  return firstLine.length > 140 ? `${firstLine.slice(0, 140)}…` : firstLine;
}

/**
 * PUBLIC_INTERFACE
 * sortNotesByUpdatedDesc
 *
 * Contract:
 * - Input: Note[]
 * - Output: Note[] new array sorted by updatedAt desc (stable enough for UI)
 */
export function sortNotesByUpdatedDesc(notes) {
  return [...(notes || [])].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/**
 * PUBLIC_INTERFACE
 * extractAllTags
 *
 * Contract:
 * - Input: Note[]
 * - Output: string[] all unique tags, sorted A→Z
 */
export function extractAllTags(notes) {
  const set = new Set();
  for (const n of notes || []) {
    for (const t of Array.isArray(n.tags) ? n.tags : []) {
      if (t) set.add(String(t));
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
