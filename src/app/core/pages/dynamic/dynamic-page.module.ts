import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { FormRendererModule } from 'src/app/shared/form-renderer/form-renderer.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DynamicPageComponent } from './dynamic-page.component';
import { KitSectionModule } from './kit-section.module';
import { KitPreviewPageComponent } from './kit-preview-page.component';

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
  // The migration comparison, matched BEFORE the greedy :slug or it would
  // be read as a page whose slug is "kit-preview". It draws a page through
  // Section and List, in memory, beside the live one in the admin's
  // Compare view. Retires when the last page migrates.
  { path: 'kit-preview/:slug', component: KitPreviewPageComponent },
  { path: ':slug', component: DynamicPageComponent }
];

@NgModule({
  declarations: [
    DynamicPageComponent,
    KitPreviewPageComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    // The section renderer, shared with the home page - see KitSectionModule.
    KitSectionModule,
    // Gives this module the site frame (app-home-header, app-footer) and the
    // Not Found page a missing slug renders.
    SharedModule,
    // The click-to-play video two archetypes use. Loaded with this chunk
    // rather than eagerly: a page with no video never pays for it.
    YouTubePlayerModule,
    // The Form Builder renderer a FORM section shows - the section stores
    // WHICH form as an id picked by name in the admin, never typed.
    FormRendererModule,
    // ngModel, for the three-field sign-up form.
    FormsModule
  ]
})
export class DynamicPageModule { }
