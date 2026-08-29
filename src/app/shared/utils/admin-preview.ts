/** The query parameter Page Manager's previewer appends to every URL it
 *  frames. See the admin's page-live-preview.component.ts. */
const PREVIEW_PARAM = 'adminPreview';

/**
 * Latched, deliberately. Once this window is a preview it stays one: the
 * frame reloads with a new value of the parameter on every save, but an
 * in-frame router navigation would drop it, and a popup appearing halfway
 * through someone's editing session is exactly what this prevents.
 */
let latched = false;

/**
 * True when this page is being shown inside Page Manager's previewer, rather
 * than to a visitor.
 *
 * WHAT IT IS FOR: suppressing INTERRUPTIONS - things that cover the page
 * rather than being part of it. It is not a general "am I in an iframe"
 * check and must not become one; the page itself renders exactly as it does
 * for a visitor, because the whole point of framing the real page is that it
 * cannot drift from the real page.
 *
 * TWO REASONS, and the second is the stronger one:
 *
 *   1. A full-screen popup over a preview whose only job is showing the
 *      page's sections defeats it. A popup has its own editor and its own
 *      previewer in Campaigns; someone arranging home-page sections is not
 *      previewing the popup.
 *   2. IT WOULD FABRICATE CAMPAIGN DATA. The popup fires a `web_shown`
 *      beacon when it opens, guarded once per visitor per popup in
 *      localStorage - so every staff browser that opened the Home screen
 *      would log a real impression against a real campaign, quietly. That is
 *      wrong whether or not anyone minds the overlay.
 *
 * Read from `window.location` rather than the router: this has to be true
 * before the first navigation resolves, and it must not depend on the router
 * preserving an unknown query parameter.
 *
 * `search` is a parameter with a default rather than a bare global read, so
 * a test can pass one. `window.location` is not configurable in Chrome and
 * cannot be spied, and a seam is a better answer than a shim.
 */
export function isAdminPreview(search: string = currentSearch()): boolean {
  if (latched) {
    return true;
  }
  try {
    latched = new URLSearchParams(search).has(PREVIEW_PARAM);
  } catch {
    latched = false;
  }
  return latched;
}

function currentSearch(): string {
  try {
    return typeof window === 'undefined' ? '' : window.location.search;
  } catch {
    return '';
  }
}

/**
 * Clears the latch. FOR TESTS ONLY - nothing in the app calls this.
 *
 * It exists because the latch is the part of this worth pinning, and a
 * module-level flag survives from one spec to the next: without a reset the
 * first test to latch would make every later one pass for the wrong reason.
 */
export function resetAdminPreviewLatch(): void {
  latched = false;
}
