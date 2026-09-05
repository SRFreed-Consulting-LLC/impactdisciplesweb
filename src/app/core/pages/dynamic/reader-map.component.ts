import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject
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
  /** Staggers the entrance so the dots arrive as a scatter rather than all
   *  at once, which looks like a rendering glitch. Seconds. */
  delay: number;
}

/**
 * WHERE THE DISCIPLESHIP LIBRARY IS BEING READ.
 *
 * A dot per reader on a world map, live: the document it draws is rebuilt by
 * onLibraryUserWritten whenever a reader is written, so somebody signing in
 * for the first time appears here within a second or two.
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
    // point of the piece, and the document is a few kilobytes at most.
    const points = collection(this.firestore, tenantPath('library_map'));
    this.stop = onSnapshot(
      doc(points, 'points'),
      (snap) => {
        const data = snap.data() as LibraryMapModel | undefined;
        this.dots = this.project(data?.points ?? []);
        this.total = data?.total ?? this.dots.length;
        this.loading = false;
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
      dots.push({
        x: ((p.lng + 180) / 360) * w.width,
        y: ((w.latTop - p.lat) / (w.latTop - w.latBottom)) * w.height,
        delay: (i % 12) * 0.12
      });
    });
    return dots;
  }

  /** @param index The dot's position. @returns A stable key. */
  trackDot(index: number): number {
    return index;
  }

  /** @param index The path's position. @returns A stable key. */
  trackPath(index: number): number {
    return index;
  }
}
