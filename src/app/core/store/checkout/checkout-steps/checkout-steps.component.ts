import { Component, Input } from '@angular/core';

export type CheckoutStep = 'shipping' | 'payment' | 'confirm';

// Small presentational progress indicator for the restructured checkout --
// makes the same conceptual steps the original checkout already has
// (shipping/contact info, then payment, then a confirmation page) visible
// as a real step indicator instead of two silently-toggled view booleans.
@Component({
  selector: 'app-checkout-steps',
  templateUrl: './checkout-steps.component.html',
  styleUrls: ['./checkout-steps.component.scss'],
  standalone: false
})
export class CheckoutStepsComponent {
  @Input() current: CheckoutStep = 'shipping';
}
