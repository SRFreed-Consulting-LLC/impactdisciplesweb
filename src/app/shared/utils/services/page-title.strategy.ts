import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * Brand suffix for every page title. index.html's own <title> is the
 * pre-navigation value and should read the same.
 */
export const SITE_TITLE = 'Impact Disciples Ministries';

// Not one route in the app set a title before this (bucket A, web item 7),
// so every page - store, checkout, every article - shared whatever
// index.html said. That is the text a browser tab, a bookmark, a shared
// link and a search result all use.
//
// Angular's DEFAULT TitleStrategy would set document.title to the route
// title verbatim, dropping the brand entirely; this appends it, and falls
// back to the brand alone for routes that set no title of their own (the
// deep detail routes, whose real title is a record that has not loaded
// yet - see the note in app-routing.module.ts).
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    this.title.setTitle(routeTitle ? `${routeTitle} | ${SITE_TITLE}` : SITE_TITLE);
  }
}
