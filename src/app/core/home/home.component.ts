import { Component } from '@angular/core';

/**
 * The public home page: a stack of sections, in the order a visitor meets
 * them.
 *
 * Every section is now a component of its own - the OUR VISION video was
 * the last one written inline and came out on 2026-08-29. The stack is
 * still fixed here; the next step reads it from `home_sections` so staff
 * can reorder, switch off and add sections without a deploy.
 */
@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    standalone: false
})
export class HomeComponent {
}
