import { Component, Input } from '@angular/core';

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
  @Input() title = 'OUR VISION';

  @Input() subtitle =
    'Impact Discipleship Ministries exists to inspire people and churches ' +
    'to be and build disciples of Jesus Christ.';

  /** The still shown behind the play button, before anyone clicks. */
  @Input() posterUrl =
    'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/' +
    'Web-Pages%2FShared%2Fmap.jpg?alt=media&token=9db9c6f4-c852-4722-807e-5fa5d93f881a';

  /** The bare YouTube id - `youtube-player` takes an id, not a URL. */
  @Input() videoId = 'HxKSa24hF60';

  isPlaying = false;

  playVideo() {
    this.isPlaying = true;
  }
}
