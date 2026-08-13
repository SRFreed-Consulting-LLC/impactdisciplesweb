import { Component, Input } from '@angular/core';

// Replaces the raw document.querySelector('#submit')...classList
// manipulation the original CheckoutComponent.setLoading() (and the
// byte-for-byte duplicate in give.component.ts, left untouched) uses for
// loading state. Modeled directly on dynamic-form.component.ts's existing
// boolean-Input + @if pattern -- the one place in the app already doing
// this the "right" way.
@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  standalone: false
})
export class SpinnerComponent {
  @Input() loading = false;
  @Input() label = '';
  @Input() size: 'sm' | 'md' = 'md';
}
