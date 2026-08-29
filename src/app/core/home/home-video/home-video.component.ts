import { Component, Input } from '@angular/core';
import { HOME_VIDEO_DEFAULT } from 'src/app/shared/utils/data/home-section-defaults';

/**
 * The OUR VISION section - a heading, a line of copy, and a poster image
 * that swaps for a YouTube player when clicked.
 *
 * Extracted from home.component.html on 2026-08-29, where it was the only
 * section written inline rather than as a component.
 *
 * Every field defaults to what the page has always shown, so a section
 * record that leaves one blank renders today's content rather than an empty
 * box. The home page's fallback stack relies on that: it names six sections
 * by type and supplies no content at all.
 */
@Component({
    selector: 'app-home-video',
    templateUrl: './home-video.component.html',
    styleUrls: ['./home-video.component.scss'],
    standalone: false
})
export class HomeVideoComponent {
  @Input() title = HOME_VIDEO_DEFAULT.title;

  @Input() subtitle = HOME_VIDEO_DEFAULT.subtitle;

  /** The still shown behind the play button, before anyone clicks. */
  @Input() posterUrl = HOME_VIDEO_DEFAULT.posterUrl;

  /** The bare YouTube id - `youtube-player` takes an id, not a URL. */
  @Input() videoId = HOME_VIDEO_DEFAULT.videoId;

  isPlaying = false;

  playVideo() {
    this.isPlaying = true;
  }
}
