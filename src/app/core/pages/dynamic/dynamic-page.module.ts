import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { SharedModule } from 'src/app/shared/shared.module';
import { DynamicPageComponent } from './dynamic-page.component';
import { KitSectionComponent } from './kit-section.component';

/**
 * Pages staff created, which have no route of their own.
 *
 * ONE route, `:slug`, taking whatever segment the outer matcher handed over.
 * The outer matcher in app-routing.module.ts consumes NOTHING, so this sees
 * the full URL and can name the parameter.
 *
 * The twelve original pages are not routed here and never will be while they
 * keep their own components - DynamicPageComponent refuses any document with
 * no `title`, which is exactly the set of them.
 */
const routes: Routes = [
  { path: ':slug', component: DynamicPageComponent }
];

@NgModule({
  declarations: [
    DynamicPageComponent,
    KitSectionComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    // Gives this module the site frame (app-home-header, app-footer) and the
    // Not Found page a missing slug renders.
    SharedModule,
    // The click-to-play video two archetypes use. Loaded with this chunk
    // rather than eagerly: a page with no video never pays for it.
    YouTubePlayerModule
  ]
})
export class DynamicPageModule { }
