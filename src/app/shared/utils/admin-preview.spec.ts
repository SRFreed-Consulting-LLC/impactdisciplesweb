import { isAdminPreview, resetAdminPreviewLatch } from './admin-preview';

// This flag decides whether a full-screen popup opens over a page and, more
// importantly, whether a `web_shown` impression is logged against a real
// campaign. Getting it wrong in either direction is a live problem: too eager
// and visitors stop seeing popups, too shy and staff browsers fabricate
// campaign data. It also LATCHES, which is the part worth pinning.
//
// The query string is a PARAMETER with a default, so there is nothing to
// stub: window.location is not configurable in Chrome and cannot be spied.
describe('isAdminPreview', () => {
  // The latch is a module-level flag and survives from one spec to the next -
  // without this the first test to latch would make every later one pass for
  // the wrong reason.
  beforeEach(() => resetAdminPreviewLatch());

  it('is false for an ordinary visit', () => {
    expect(isAdminPreview('')).toBe(false);
  });

  it('is false for a campaign link, which carries its own parameters', () => {
    // The popup's own click-through produces `/?cid=abc`, and the home-page
    // check deliberately strips the query string so that still counts as
    // home. A visitor arriving that way must still see popups.
    expect(isAdminPreview('?cid=abc&csrc=popup')).toBe(false);
  });

  it('is true when the previewer framed it', () => {
    expect(isAdminPreview('?adminPreview=3')).toBe(true);
  });

  it('is true even at revision 0, which is a real revision', () => {
    // The frame starts at 0 and counts up per save. A truthiness check on the
    // value would have missed the first load entirely.
    expect(isAdminPreview('?adminPreview=0')).toBe(true);
  });

  it('is true alongside other parameters', () => {
    expect(isAdminPreview('?cid=abc&adminPreview=2')).toBe(true);
  });

  it('LATCHES, so an in-frame navigation cannot bring the popup back', () => {
    expect(isAdminPreview('?adminPreview=1')).toBe(true);

    // The router drops an unknown parameter on the next navigation; a popup
    // appearing halfway through someone's editing session is exactly what
    // this prevents.
    expect(isAdminPreview('')).toBe(true);
  });
});
