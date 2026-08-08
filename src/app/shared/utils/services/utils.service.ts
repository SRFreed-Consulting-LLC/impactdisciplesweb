import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

/**
 * Trimmed replacement for the old `theme/shared/services/utils.service.ts`.
 * That service pulled in the (dead, unrouted) theme CartService/ProductService
 * and 1,600+ lines of hardcoded demo catalog data just to provide the mobile
 * nav toggle and a video-embed helper -- the only two things any live page
 * actually used. This keeps just those.
 */
@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  public openMobileMenus: boolean = false;
  public isVideoOpen: boolean = false;
  public videoUrl: string = 'https://www.youtube.com/embed/EW4ZYb3mCZk';
  private iframeElement: HTMLIFrameElement | null = null;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.openMobileMenus = false;
      }
    });
  }

  // open mobile sidebar
  handleOpenMobileMenu() {
    this.openMobileMenus = !this.openMobileMenus;
  }

  // modal video play
  playVideo(videoId: string) {
    const videoOverlay = document.querySelector('#video-overlay');
    this.videoUrl = `https://www.youtube.com/embed/${videoId}`;
    if (!this.iframeElement) {
      this.iframeElement = document.createElement('iframe');
      this.iframeElement.setAttribute('src', this.videoUrl);
      this.iframeElement.style.width = '60%';
      this.iframeElement.style.height = '80%';
    }

    this.isVideoOpen = true;
    videoOverlay?.classList.add('open');
    videoOverlay?.appendChild(this.iframeElement);
  }
}
