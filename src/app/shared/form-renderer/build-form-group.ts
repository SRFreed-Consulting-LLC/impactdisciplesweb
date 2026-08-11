import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormFieldDef, isLayoutFieldType } from 'src/app/common/models/domain/form-field.model';

// Ported from the sibling impactdisciples-admin repo's file of the same
// name (src/app/shared/form-renderer/build-form-group.ts) - identical
// logic, kept in sync by hand. Builds one flat top-level FormGroup for a
// whole fields[] tree, keyed by each data field's own id - including fields
// nested inside a 'columns' container, which recurses into both column
// arrays but never becomes a control itself (it's structural, not a value).
// Address/Phone are the two exceptions that are themselves nested
// FormGroups, matching dynamic-form-field.component.html's own plain-input
// group markup for those two types.
export function buildFormGroup(fields: FormFieldDef[]): FormGroup {
  const group = new FormGroup({});
  addControls(fields, group);
  return group;
}

function addControls(fields: FormFieldDef[], group: FormGroup): void {
  for (const field of fields) {
    if (field.type === 'columns') {
      (field.columns ?? []).forEach((column) => addControls(column.fields, group));
      continue;
    }
    if (isLayoutFieldType(field.type)) {
      continue; // heading/instructions/image/divider - structural, no submitted value.
    }

    const required = !!field.required;

    if (field.type === 'address') {
      group.addControl(
        field.id,
        new FormGroup({
          address1: new FormControl('', required ? [Validators.required] : []),
          address2: new FormControl(''),
          city: new FormControl('', required ? [Validators.required] : []),
          state: new FormControl('', required ? [Validators.required] : []),
          zip: new FormControl('', required ? [Validators.required] : [])
        })
      );
      continue;
    }

    if (field.type === 'phone') {
      group.addControl(
        field.id,
        new FormGroup({
          countryCode: new FormControl(''),
          number: new FormControl('', required ? [Validators.required] : []),
          type: new FormControl(null)
        })
      );
      continue;
    }

    if (field.type === 'checkbox') {
      group.addControl(field.id, new FormControl(false, required ? [Validators.requiredTrue] : []));
      continue;
    }

    if (field.type === 'checkboxes') {
      group.addControl(field.id, new FormControl<string[]>([], required ? [Validators.required] : []));
      continue;
    }

    if (field.type === 'date') {
      group.addControl(field.id, new FormControl<string>('', required ? [Validators.required] : []));
      continue;
    }

    group.addControl(field.id, new FormControl('', required ? [Validators.required] : []));
  }
}
