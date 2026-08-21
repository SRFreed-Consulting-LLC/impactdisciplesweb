import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { controlStyleVars, fieldStyleObject, FormFieldDef, IMAGE_WIDTH_CSS } from '@impact-common/shared/models/domain/form-field.model';

// Renders exactly one FormFieldDef against the shared top-level FormGroup a
// parent app-dynamic-form built (see build-form-group.ts) - dispatches by
// field.type, recursing into itself for a 'columns' field's own arrays (a
// field inside a column is just another FormFieldDef). Plain native HTML
// controls throughout, not Angular Material (this app has none) - the
// admin app's equivalent (FormRendererFieldComponent) is the Material
// version of this same idea.
@Component({
    selector: 'app-dynamic-form-field',
    templateUrl: './dynamic-form-field.component.html',
    styleUrls: ['./dynamic-form-field.component.scss'],
    standalone: false
})
export class DynamicFormFieldComponent {
  @Input() field: FormFieldDef;
  @Input() form: FormGroup;

  readonly stars = [1, 2, 3, 4, 5];

  get styleObject(): Record<string, string> {
    return fieldStyleObject(this.field.style);
  }

  // Combined with this field's own controlStyle override (if any) - Angular
  // doesn't allow two [ngStyle] bindings on one element, so this merges what
  // used to be two separate getters. See the admin app's equivalent
  // FormRendererFieldComponent.wrapperStyle for the same pattern.
  get wrapperStyle(): Record<string, string> {
    return { ...this.styleObject, ...controlStyleVars(this.field.controlStyle) };
  }

  get imageWidthCss(): string {
    return IMAGE_WIDTH_CSS[this.field.imageWidth ?? 'medium'];
  }

  get usesPlaceholder(): boolean {
    return this.field.labelDisplay === 'placeholder';
  }

  get placeholderText(): string {
    return this.field.placeholder || this.field.label;
  }

  control(): FormControl {
    return this.form.get(this.field.id) as FormControl;
  }

  group(): FormGroup {
    return this.form.get(this.field.id) as FormGroup;
  }

  hasError(errorCode: string): boolean {
    const control = this.control();
    return !!control && control.touched && control.hasError(errorCode);
  }

  // Address/phone are the two group types (nested FormGroups, not a single
  // control) - a plain hasError('required') on the group itself doesn't
  // mean anything (FormGroup has no 'required' validator of its own, only
  // its children do). Without this, a required-but-blank sub-field (e.g.
  // Zip) left the whole form invalid on submit with literally no visible
  // indication of which field was the problem - live-diagnosed against the
  // Consultation Survey form's own required address group.
  groupHasError(): boolean {
    const group = this.group();
    return !!group && group.touched && group.invalid;
  }

  isChecked(value: string): boolean {
    const current = (this.control()?.value as string[]) ?? [];
    return current.includes(value);
  }

  toggleOption(value: string, checked: boolean): void {
    const control = this.control();
    if (!control) {
      return;
    }
    const current = (control.value as string[]) ?? [];
    control.setValue(checked ? [...current, value] : current.filter((v) => v !== value));
  }

  ratingValue(): number {
    return Number(this.control()?.value) || 0;
  }

  setRating(value: number): void {
    this.control()?.setValue(value);
  }
}
