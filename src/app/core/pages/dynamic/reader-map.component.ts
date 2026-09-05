import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject
} from '@angular/core';
import { Firestore, collection, doc, onSnapshot } from '@angular/fire/firestore';
import { tenantPath } from '@impact-common/shared/lists/tenancy';
import { LibraryMapModel } from '@impact-common/shared/models/domain/library-map.model';

/** The pre-rendered world, built by the admin repo's
 *  scripts/build-world-map-paths.js. See that file for the projection. */
interface WorldPaths {
  width: number;
  height: number;
  latTop: number;
  latBottom: number;
  paths: string[];
}

/** One dot, in viewBox units. */
interface Dot {
  x: number;
  y: number;
  /** Its coordinate as a string - how a dot is recognised between snapshots.
   *  There is no id in the published data, and deliberately so. */
  key: string;
  /** Staggers the entrance so dots arrive as a scatter rather than all at
   *  once, which looks like a rendering glitch. Seconds. */
  delay: number;
  /** Just arrived or just moved: drawn amber for a few seconds, the same
   *  treatment the Library tab's own map gives a fresh sign-in. */
  fresh: boolean;
}

/** How long a dot stays amber after appearing or moving. Matches the admin
 *  map's GLOW_DURATION_MS so the two read as the same thing. */
const GLOW_DURATION_MS = 5000;

/**
 * WHERE THE DISCIPLESHIP LIBRARY IS BEING READ.
 *
 * A dot per reader on a world map, live: the document it draws is rebuilt by
 * onLibraryUserWritten whenever a reader is written, so somebody signing in
 * appears here about four seconds later, with no refresh.
 *
 * IT CANNOT SHOW YOU WHO THEY ARE, and that is the design rather than a
 * limitation. `libraryUsers` is readable only by its owner or an admin and
 * carries emails, phone numbers, licences and last-login times; the admin's
 * own map reads it directly and names each reader in a popup, which is fine
 * behind a staff login and unpublishable here. This reads
 * `library_map/points`, which holds coordinates and a total and nothing else
 * - no name, no city, not even a count per place. There is nothing to click,
 * because there is nothing to say.
 *
 * A DOT IS RECOGNISED BY ITS COORDINATE, since the published data has no id
 * to offer. Two readers cannot collide on one coordinate: the function
 * offsets each by a small amount seeded from their own id, which exists so
 * that a city's readers draw as separate dots rather than one.
 *
 * NO MAPPING LIBRARY AND NO TILE SERVICE. The world is 176 SVG paths in an
 * equirectangular viewBox, pre-projected at build time; a dot is two
 * multiplications on the same projection, so the dots and the coastlines
 * cannot disagree about where a coordinate is. That also means no API key to
 * expire - the admin's Leaflet map uses a CARTO key registered to the admin
 * domains, which would stamp "API KEY REQUIRED" across every tile here.
 */
@Component({
  selector: 'app-reader-map',
  templateUrl: './reader-map.component.html',
  styleUrls: ['./reader-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ReaderMapComponent implements OnInit, OnDestroy {
  private readonly firestore = inject(Firestore);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  world: WorldPaths | null = null;
  dots: Dot[] = [];
  total = 0;
  /** True until BOTH the world and the first snapshot have arrived - the map
   *  is meaningless with one and not the other. */
  loading = true;
  /** The map could not be drawn at all. Renders nothing rather than an error:
   *  a decorative band on a marketing page should fail quietly. */
  failed = false;

  private stop: (() => void) | undefined;
  private seen = new Set<string>();
  /** False only for the very first snapshot. A page load is not "people just
   *  showing up", so nothing glows until a dot genuinely appears or moves
   *  AFTER that - otherwise every visitor sees the whole map light up as
   *  though everyone signed in at once. */
  private hasLoadedOnce = false;
  private glowTimers: ReturnType<typeof setTimeout>[] = [];

  async ngOnInit(): Promise<void> {
    try {
      const res = await fetch('assets/world-map-paths.json');
      if (!res.ok) {
        throw new Error(`world-map-paths.json: ${res.status}`);
      }
      this.world = await res.json();
    } catch {
      this.failed = true;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    // A live listener rather than a one-off read: "runs live" is the whole
    // point of the piece, and the document is under a kilobyte.
    const points = collection(this.firestore, tenantPath('library_map'));
    this.stop = onSnapshot(
      doc(points, 'points'),
      (snap) => {
        const data = snap.data() as LibraryMapModel | undefined;
        this.dots = this.project(data?.points ?? []);
        this.total = data?.total ?? this.dots.length;
        this.loading = false;
        this.hasLoadedOnce = true;
        this.scheduleGlowEnd();
        this.cdr.markForCheck();
      },
      () => {
        // Denied or offline. The world still draws; it simply has no dots.
        this.dots = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    );
  }

  ngOnDestroy(): void {
    this.stop?.();
    this.glowTimers.forEach((t) => clearTimeout(t));
  }

  /**
   * Turns coordinates into viewBox positions, using the SAME projection the
   * paths were built with - which is why latTop/latBottom travel in the file
   * rather than being repeated as constants here.
   * @param points The published coordinates.
   * @returns One dot per point that lands inside the frame.
   */
  private project(points: { lat: number; lng: number }[]): Dot[] {
    const w = this.world;
    if (!w) {
      return [];
    }
    const dots: Dot[] = [];
    points.forEach((p, i) => {
      if (typeof p?.lat !== 'number' || typeof p?.lng !== 'number') {
        return;
      }
      // The frame is cropped below -56 degrees (no Antarctica). A reader
      // south of that is off the map; skip rather than clamp them onto the
      // bottom edge, where a row of dots would read as a data error.
      if (p.lat > w.latTop || p.lat < w.latBottom) {
        return;
      }
      const key = `${p.lat},${p.lng}`;
      dots.push({
        x: ((p.lng + 180) / 360) * w.width,
        y: ((w.latTop - p.lat) / (w.latTop - w.latBottom)) * w.height,
        key,
        delay: (i % 12) * 0.12,
        fresh: this.hasLoadedOnce && !this.seen.has(key)
      });
    });
    this.seen = new Set(dots.map((d) => d.key));
    return dots;
  }

  /**
   * Fades the amber back to the steady colour once the glow has had its time.
   *
   * Outside Angular's zone, because a timer inside it wakes change detection
   * for the whole application every few seconds on a page that is otherwise
   * idle - on a marketing page that is pure waste.
   */
  private scheduleGlowEnd(): void {
    if (!this.dots.some((d) => d.fresh)) {
      return;
    }
    this.zone.runOutsideAngular(() => {
      const timer = setTimeout(() => {
        this.dots = this.dots.map((d) => (d.fresh ? { ...d, fresh: false } : d));
        this.zone.run(() => this.cdr.markForCheck());
      }, GLOW_DURATION_MS);
      this.glowTimers.push(timer);
    });
  }

  /** @param index The dot's position. @param dot The dot. @returns Its key. */
  trackDot(index: number, dot: Dot): string {
    return dot.key;
  }

  /** @param index The path's position. @returns A stable key. */
  trackPath(index: number): number {
    return index;
  }
}
