const { test, expect } = require("@playwright/test");

function getBaseUrl() {
  // PUBLIC_INTERFACE
  /** Resolve base URL for E2E runs.
   *
   * Contract:
   * - Uses PLAYWRIGHT_BASE_URL when set (recommended in CI), else defaults to localhost:3000.
   */
  return process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
}

test.describe("Smart Notes - smoke flow", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure a clean slate for each test run.
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch (e) {
        // If storage is blocked, the app still renders but won't persist across reloads.
      }
    });
  });

  test("create/edit/search/tag/delete note", async ({ page }) => {
    await page.goto(getBaseUrl(), { waitUntil: "domcontentloaded" });

    // Create note
    await page.getByRole("button", { name: /new note/i }).first().click();

    // Editor should be visible; fill title/body
    await page.locator("#note_title").fill("E2E Note Alpha");
    await page.locator("#note_body").fill("This is a body for alpha.\nSecond line.");

    // Add tags and commit via Enter (NoteEditor normalizes tags on Enter/blur)
    await page.locator("#note_tags").fill("work, e2e");
    await page.locator("#note_tags").press("Enter");

    // Verify tag pills render in editor
    await expect(page.getByLabel("Current tags")).toContainText(["work", "e2e"]);

    // Verify list shows the note
    await expect(page.getByRole("button", { name: /e2e note alpha/i })).toBeVisible();

    // Search (title)
    await page.locator("#notes_search").fill("alpha");
    await expect(page.getByRole("button", { name: /e2e note alpha/i })).toBeVisible();

    // Search (non-match)
    await page.locator("#notes_search").fill("does-not-exist");
    await expect(page.getByText(/no matches/i)).toBeVisible();

    // Clear search
    await page.locator("#notes_search").fill("");
    await expect(page.getByRole("button", { name: /e2e note alpha/i })).toBeVisible();

    // Tag filter exact match (case-insensitive expectation in app)
    await page.locator("#notes_tag_filter").fill("WORK");
    await expect(page.getByRole("button", { name: /e2e note alpha/i })).toBeVisible();

    // Tag filter non-match should show "No matches"
    await page.locator("#notes_tag_filter").fill("nonexistent");
    await expect(page.getByText(/no matches/i)).toBeVisible();

    // Clear tag filter to proceed
    await page.locator("#notes_tag_filter").fill("");

    // Edit note title and ensure list updates
    await page.locator("#note_title").fill("E2E Note Alpha (Edited)");
    await expect(page.getByRole("button", { name: /e2e note alpha \(edited\)/i })).toBeVisible();

    // Delete note (confirm dialog)
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole("button", { name: /^delete$/i }).click();

    // After deletion there should be no notes left
    await expect(page.getByText(/no notes yet/i)).toBeVisible();
  });
});
