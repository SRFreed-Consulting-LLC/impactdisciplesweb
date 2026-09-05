import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef,
  NgZone, OnDestroy, ViewChild, inject
} from '@angular/core';
import { Firestore, collection, doc, onSnapshot } from '@angular/fire/firestore';
import * as L from 'leaflet';
import { tenantPath } from '@impact-common/shared/lists/tenancy';
import {
  LibraryMapModel, LibraryMapPoint
} from '@impact-common/shared/models/domain/library-map.model';

/**
 * CARTO Basemaps key.
 *
 * The same one the admin's Library map uses. Its comment there says it is
 * locked to the admin domains; it is not - tiles come back identically for
 * this domain, that one, and a domain that does not exist - which is why this
 * works here at all, and also worth knowing: anyone who reads this bundle can
 * spend the free tier's 5M tiles a month. Regenerate at
 * carto.com/basemaps/apikey if that ever matters.
 */
const CARTO_BASEMAPS_KEY = 'cb1_2wr3_1_c3522e86bdefd6fe319914bf';

/** How long a marker stays amber after appearing or moving. Matches the
 *  admin map's GLOW_DURATION_MS, so the two mean the same by the same
 *  colour. */
const GLOW_DURATION_MS = 5000;

/**
 * WHERE THE DISCIPLESHIP LIBRARY IS BEING READ.
 *
 * A marker per reader on a real, pannable, zoomable map - the same Leaflet
 * treatment as the Library tab's own, because the owner asked for that one
 * rather than a picture of it. Live: the document it draws is rebuilt by
 * onLibraryUserWritten whenever a reader is written, so a sign-in reaches this
 * page about four seconds later with no refresh.
 *
 * ITS POPUP SAYS WHERE, NEVER WHO. The admin's map names the reader; this one
 * cannot, and the difference is not a setting - it is the data. `libraryUsers`
 * is readable only by its owner or an admin and carries emails, phone numbers,
 * licences and last-login times. This reads `library_map/points`, which
 * carries coordinates, the place names that go with them, and a total. There
 * is no name in it to show.
 *
 * A MARKER IS RECOGNISED BY ITS COORDINATE, since the published data has no id
 * to offer. Two readers cannot collide on one: the function offsets each by an
 * amount seeded from their own id, which exists precisely so that a city's
 * readers draw as separate markers rather than one.
 */
@Component({
  selector: 'app-reader-map',
  templateUrl: './reader-map.component.html',
  styleUrls: ['./reader-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ReaderMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer!: ElementRef<HTMLDivElement>;

  private readonly firestore = inject(Firestore);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  total = 0;
  loading = true;

  private map: L.Map | undefined;
  private stop: (() => void) | undefined;
  private readonly markers = new Map<string, L.Marker>();
  private readonly glowTimers = new Map<string, ReturnType<typeof setTimeout>>();
  /** False only for the first snapshot. A page load is not "people just
   *  showing up"; without this every visitor would see the whole map light up
   *  as though everyone signed in at once. */
  private hasLoadedOnce = false;

  ngAfterViewInit(): void {
    this.ensureLeafletStylesheet();

    // OUTSIDE ANGULAR. Leaflet binds mousemove, zoom and drag handlers that
    // fire continuously; inside the zone each one wakes change detection for
    // the whole application, and panning the map would peg a core.
    this.zone.runOutsideAngular(() => {
      this.map = L.map(this.mapContainer.nativeElement, {
        center: [25, -20],
        zoom: 2,
        minZoom: 2,
        // Stops an endless grey void either side of the world at low zoom.
        maxBounds: L.latLngBounds([-85, -180], [85, 180]),
        maxBoundsViscosity: 0.7,
        worldCopyJump: true,
        // The page scrolls; a map that eats the wheel traps a reader trying
        // to get past it. Zoom by the +/- control, or ctrl+wheel.
        scrollWheelZoom: false
      });

      // dark_nolabels rather than dark_all, as on the admin map: the labelled
      // variant renders every place name in its own local language, which is
      // a jarring mix of scripts across one map.
      L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png?key=${CARTO_BASEMAPS_KEY}`,
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19
        }
      ).addTo(this.map);
    });

    const points = collection(this.firestore, tenantPath('library_map'));
    this.stop = onSnapshot(
      doc(points, 'points'),
      (snap) => {
        const data = snap.data() as LibraryMapModel | undefined;
        this.plot(data?.points ?? []);
        this.total = data?.total ?? this.markers.size;
        this.loading = false;
        this.hasLoadedOnce = true;
        this.cdr.markForCheck();
      },
      () => {
        // Denied or offline. The map still draws; it simply has no markers.
        this.loading = false;
        this.cdr.markForCheck();
      }
    );
  }

  ngOnDestroy(): void {
    this.stop?.();
    this.glowTimers.forEach((t) => clearTimeout(t));
    this.map?.remove();
  }

  /**
   * Reconciles the markers on the map against a fresh snapshot.
   *
   * Added, moved and removed rather than torn down and rebuilt: recreating
   * every marker on every emission makes an unchanged one flicker, and loses
   * the open popup of anyone reading it at that moment.
   * @param points The published coordinates.
   */
  private plot(points: LibraryMapPoint[]): void {
    if (!this.map) {
      return;
    }
    const map = this.map;
    this.zone.runOutsideAngular(() => {
      const seen = new Set<string>();

      for (const p of points) {
        if (typeof p?.lat !== 'number' || typeof p?.lng !== 'number') {
          continue;
        }
        const key = `${p.lat},${p.lng}`;
        seen.add(key);

        let marker = this.markers.get(key);
        if (!marker) {
          marker = L.marker([p.lat, p.lng], { icon: this.icon(false) }).addTo(map);
          this.markers.set(key, marker);
          if (this.hasLoadedOnce) {
            this.glow(key, marker);
          }
        }

        const where = this.placeOf(p);
        if (where) {
          marker.bindPopup(
            `<span class="rmap__where">${this.escape(where)}</span>`,
            { closeButton: false, className: 'rmap__popup' }
          );
        } else {
          marker.unbindPopup();
        }
      }

      for (const [key, marker] of [...this.markers]) {
        if (!seen.has(key)) {
          map.removeLayer(marker);
          this.markers.delete(key);
          const timer = this.glowTimers.get(key);
          if (timer) {
            clearTimeout(timer);
            this.glowTimers.delete(key);
          }
        }
      }
    });
  }

  /**
   * Turns a marker amber, then back.
   * @param key The marker's coordinate key.
   * @param marker The marker itself.
   */
  private glow(key: string, marker: L.Marker): void {
    marker.setIcon(this.icon(true));
    const existing = this.glowTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    this.glowTimers.set(key, setTimeout(() => {
      // It may have been removed by a later snapshot while glowing.
      if (this.markers.get(key) === marker) {
        marker.setIcon(this.icon(false));
      }
      this.glowTimers.delete(key);
    }, GLOW_DURATION_MS));
  }

  /**
   * @param fresh Whether this reader has just appeared or moved.
   * @returns The marker's icon - a dot with a pulsing halo behind it.
   */
  private icon(fresh: boolean): L.DivIcon {
    return L.divIcon({
      className: `rmap__marker${fresh ? ' rmap__marker--fresh' : ''}`,
      html: '<span class="rmap__halo"></span><span class="rmap__dot"></span>',
      iconSize: [16, 16]
    });
  }

  /**
   * @param p A published point.
   * @returns "Atlanta, Georgia, United States", or as much of it as exists.
   */
  private placeOf(p: LibraryMapPoint): string {
    return [p.city, p.region, p.country].filter(Boolean).join(', ');
  }

  /**
   * The popup takes an HTML string, and this text came out of a database.
   * @param text The place name.
   * @returns It, safe to interpolate.
   */
  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Leaflet's own stylesheet, injected once, on the one page that needs it
   *  rather than loaded app-wide. Copied to the build root by angular.json. */
  private ensureLeafletStylesheet(): void {
    const href = 'leaflet.css';
    if (document.querySelector(`link[data-vendor-stylesheet="${href}"]`)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset['vendorStylesheet'] = href;
    document.head.appendChild(link);
  }
}
