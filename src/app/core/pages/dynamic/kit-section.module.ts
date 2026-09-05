import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormRendererModule } from 'src/app/shared/form-renderer/form-renderer.module';
import { KitSectionComponent } from './kit-section.component';
import { ReaderMapComponent } from './reader-map.component';

/**
 * The section renderer, on its own so that MORE THAN ONE ROUTE can draw it.
 *
 * It lived in DynamicPageModule while the dynamic route was its only caller.
 * The home page's cutover (2026-08-31) made it a second caller, and
 * importing DynamicPageModule to get at it would have registered that
 * module's ROUTES a second time - `:slug` and `kit-preview/:slug` - which is
 * how a route starts resolving to the wrong component.
 *
 * So: this module owns the renderer and its dependencies, and both page
 * modules import it. It declares no routes of its own on purpose.
 */
@NgModule({
  declarations: [KitSectionComponent, ReaderMapComponent],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    // The click-to-play video two archetypes use. Loaded with whichever
    // chunk pulls this in, rather than eagerly.
    YouTubePlayerModule,
    // The Form Builder renderer a FORM section shows - the section stores
    // WHICH form as an id picked by name in the admin, never typed.
    FormRendererModule,
    // ngModel, for the three-field sign-up form.
    FormsModule
  ],
  exports: [KitSectionComponent]
})
export class KitSectionModule { }
