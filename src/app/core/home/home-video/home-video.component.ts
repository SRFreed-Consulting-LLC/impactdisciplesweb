import { Component } from '@angular/core';

/**
 * The OUR VISION section - a heading, a line of copy, and a poster image
 * that swaps for a YouTube player when clicked.
 *
 * Extracted from home.component.html, where it was the only section written
 * inline rather than as a component (2026-08-29). Nothing about it changed
 * in the move; the heading, the copy, the poster URL and the video id are
 * still literals here, and become data in the next step.
 */
@Component({
    selector: 'app-home-video',
    templateUrl: './home-video.component.html',
    styleUrls: ['./home-video.component.scss'],
    standalone: false
})
export class HomeVideoComponent {
  isPlaying = false;

  playVideo() {
    this.isPlaying = true;
  }
}
