import { Injectable, NgZone } from '@angular/core';

/** How often to re-measure while the page is still settling. */
const TICK_MS = 400;

/** How long to keep measuring after a load. Nothing interacts with a framed
 *  preview - the parent sets `pointer-events: none` on it - so once images
 *  and fonts have landed the height stops moving for good. */
const SETTLE_MS = 30_000;

/**
 * Tells a parent window how tall this page is, when the site is being shown
 * inside an iframe.
 *
 * WHY IT EXISTS. Page Manager's previewer stopped being a hand-drawn sketch
 * on 2026-08-29 and became the real page in a scaled frame - which is exact,
 * and can never drift from the site the way a sketch does. The one thing a
 * parent cannot do across origins is measure its child, so an iframe either
 * gets a guessed height (whitespace, or a clipped footer) or the child tells
 * it. This is the child telling it.
 *
 * IT POLLS, AND A ResizeObserver WOULD NOT DO. The obvious implementation -
 * observe `document.documentElement` - was the first one written and it
 * reported 800px for a 2,814px page. The theme puts `height: 100%` on both
 * `html` and `body`, so their BOXES are exactly the viewport and never
 * change; only `scrollHeight` grows. A ResizeObserver watches boxes, so it
 * fired once at first layout and then never again. `app-root` does track the
 * content height, but it computes to `display: inline`, and a
 * ResizeObserver skips non-replaced inline elements. Measuring on a timer
 * sidesteps all of that and depends on no DOM shape.
 *
 * It is bounded: it stops SETTLE_MS after the last load, because a preview is
 * not interacted with.
 *
 * IT DOES NOTHING UNLESS FRAMED. `window.parent === window` on a normal
 * visit, so nothing is measured and nothing is posted.
 *
 * IT SENDS ONLY A NUMBER, to '*'. There is no data here worth restricting -
 * the height of a public marketing page - and pinning an allowed origin
 * would mean the admin's four environments each needing a list entry that
 * silently breaks the preview when it is wrong. The parent is the side that
 * must be careful, and it is: it checks the message's shape and range and
 * ignores anything else.
 */
@Injectable({ providedIn: 'root' })
export class FrameHeightService {
  private timer?: ReturnType<typeof setInterval>;
  private stopAt = 0;
  private last = 0;

  constructor(private zone: NgZone) {}

  start(): void {
    if (typeof window === 'undefined' || window.parent === window) {
      return;
    }

    // Outside Angular: this runs a few times a second and none of those
    // ticks should schedule change detection.
    this.zone.runOutsideAngular(() => {
      this.begin();
      // Images and web fonts land after DOMContentLoaded and both move the
      // page; `load` is the moment most of that has happened.
      window.addEventListener('load', () => this.begin());
    });
  }

  private begin(): void {
    this.stopAt = Date.now() + SETTLE_MS;
    this.measure();
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      this.measure();
      if (Date.now() > this.stopAt) {
        clearInterval(this.timer);
        this.timer = undefined;
      }
    }, TICK_MS);
  }

  private measure(): void {
    const height = Math.ceil(contentHeight());
    // Only on a real change: the parent sets a CSS height from this, and
    // posting an unchanged number every tick would be noise.
    if (height === this.last || height < 1) {
      return;
    }
    this.last = height;
    window.parent.postMessage({ impactPageHeight: height }, '*');
  }
}

/**
 * How tall this page's CONTENT is - which is not `documentElement.scrollHeight`.
 *
 * That is `max(content, viewport)`, and the viewport of a frame is whatever
 * height the parent gave it. So a SHORT page inside a tall frame reports the
 * frame's own height straight back, the parent believes it, and nothing ever
 * shrinks. Circular, and it showed the moment the previewer started rendering
 * ONE section: a 200px block reported 2,400 and drew in a box of white.
 *
 * `app-root` measures the content itself - 2814 / 6412 / 1608 on three pages,
 * matching scrollHeight exactly where the page IS taller than the frame, and
 * telling the truth where it is not. scrollHeight stays as the fallback for a
 * bootstrap where app-root is not in the DOM yet.
 */
function contentHeight(): number {
  const root = document.querySelector('app-root');
  const measured = root?.getBoundingClientRect().height ?? 0;
  return measured > 0 ? measured : document.documentElement.scrollHeight;
}
