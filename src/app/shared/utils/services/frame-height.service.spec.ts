import { settleHeight } from './frame-height.service';

// The two-tick rule for a shrink, pinned on the pure function so it needs
// neither a DOM nor a clock. The service itself is a timer around this.
describe('settleHeight', () => {
  it('posts the first measurement, and any growth, at once', () => {
    // A page getting taller as images land is the normal case, and delaying
    // it shows a clipped footer.
    expect(settleHeight(0, 0, 2814)).toEqual({ post: 2814, pendingDrop: 0 });
    expect(settleHeight(2814, 0, 4068)).toEqual({ post: 4068, pendingDrop: 0 });
  });

  it('posts nothing for an unchanged height - the parent sets CSS from it', () => {
    expect(settleHeight(2814, 0, 2814)).toEqual({ post: null, pendingDrop: 0 });
  });

  it('THE BLINK: a one-tick collapse is never posted', () => {
    // Recorded 2026-09-02: 1753 -> 647 -> 1597, one tick apart, as a
    // carousel re-initialised. The parent believed all three and the preview
    // folded to a third of its height and sprang back on screen.
    const dip = settleHeight(1753, 0, 647);
    expect(dip).toEqual({ post: null, pendingDrop: 647 });

    // Next tick the page is back. Nothing was ever sent about 647.
    expect(settleHeight(1753, dip.pendingDrop, 1597)).toEqual({ post: null, pendingDrop: 1597 });
  });

  it('a REAL shrink is posted once two consecutive ticks agree', () => {
    const first = settleHeight(2814, 0, 1608);
    expect(first.post).toBeNull();

    expect(settleHeight(2814, first.pendingDrop, 1608)).toEqual({ post: 1608, pendingDrop: 0 });
  });

  it('a shrink that keeps changing is never believed until it holds still', () => {
    let state = settleHeight(3000, 0, 2000);
    state = settleHeight(3000, state.pendingDrop, 1900);
    state = settleHeight(3000, state.pendingDrop, 1800);
    expect(state.post).toBeNull();

    expect(settleHeight(3000, state.pendingDrop, 1800).post).toBe(1800);
  });

  it('growth clears a pending shrink', () => {
    const dip = settleHeight(1753, 0, 647);
    expect(settleHeight(1753, dip.pendingDrop, 1846)).toEqual({ post: 1846, pendingDrop: 0 });
  });

  it('a page with no height yet is ignored, not posted', () => {
    expect(settleHeight(0, 0, 0)).toEqual({ post: null, pendingDrop: 0 });
  });
});
