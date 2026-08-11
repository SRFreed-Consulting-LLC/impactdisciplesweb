import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
// This app's own existing toast pattern - see consultation-survey.component.ts's
// own use of the same import today. Not a new dependency.
import notify from 'devextreme/ui/notify';
import { FormDefinitionModel } from 'src/app/common/models/domain/form-definition.model';
import { flattenDataFields, FormFieldDef } from 'src/app/common/models/domain/form-field.model';
import { FormSubmissionModel } from 'src/app/common/models/domain/form-submission.model';
import { FormDefinitionService } from 'src/app/common/services/data/form-definition.service';
import { FormSubmissionService } from 'src/app/common/services/data/form-submission.service';
import { buildFormGroup } from './build-form-group';

// Reusable "load a form built in the admin app's Form Builder and render
// it" component - drop `<app-dynamic-form [formId]="...">` onto any page.
// The admin app (impactdisciples-admin) owns authoring; this app only ever
// reads a FormDefinitionModel by id and writes a FormSubmissionModel back to
// the same `form_submissions` collection its own "Preview & Test Submit"
// writes to - both apps share the same Firestore project, confirmed via
// each repo's own local environment config.
@Component({
    selector: 'app-dynamic-form',
    templateUrl: './dynamic-form.component.html',
    styleUrls: ['./dynamic-form.component.scss'],
    standalone: false
})
export class DynamicFormComponent implements OnChanges {
  @Input() formId: string;
  // Lets a specific page match its own original CTA copy (e.g. Consultation
  // Survey's "Submit Free Consultation") without forcing every future use
  // of this shared component into one generic label.
  @Input() submitButtonText = 'Submit';

  loading = true;
  submitting = false;
  submitted = false;
  notFound = false;
  formDef: FormDefinitionModel | null = null;
  form: FormGroup = new FormGroup({});

  constructor(private formDefinitionService: FormDefinitionService, private formSubmissionService: FormSubmissionService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formId'] && this.formId) {
      this.load();
    }
  }

  get fields(): FormFieldDef[] {
    return this.formDef?.fields ?? [];
  }

  private load(): void {
    this.loading = true;
    this.notFound = false;
    this.submitted = false;
    this.formDefinitionService
      .getById(this.formId)
      .then((formDef) => {
        if (!formDef) {
          this.notFound = true;
          return;
        }
        this.formDef = formDef;
        this.form = buildFormGroup(formDef.fields ?? []);
      })
      .catch(() => {
        this.notFound = true;
      })
      .finally(() => {
        this.loading = false;
      });
  }

  onSubmit(): void {
    if (!this.formDef || this.submitting) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      notify({ message: 'Please fill in all required fields.', position: 'top', width: 500, type: 'warning' });
      // On a long form the invalid field (now visibly red-bordered - see
      // dynamic-form-field.component.scss) can easily be scrolled off
      // screen, leaving the toast as the only thing anyone actually sees.
      // Scoped to actual form controls, not `.ng-invalid` generally - the
      // <form> element itself (and any nested address/phone [formGroup]
      // wrapper) also gets that class whenever it's invalid, and as the
      // first match in DOM order would otherwise "scroll to" the whole page.
      const firstInvalid = document.querySelector<HTMLElement>('.dynamic-form input.ng-invalid, .dynamic-form textarea.ng-invalid, .dynamic-form select.ng-invalid');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    this.submitting = true;
    const dataFields = flattenDataFields(this.formDef.fields ?? []);
    const submission: FormSubmissionModel = {
      formId: this.formDef.id!,
      formName: this.formDef.name,
      fieldSnapshot: dataFields.map((f) => ({ id: f.id, label: f.label, type: f.type })),
      values: this.form.getRawValue(),
      submittedAt: new Date(),
      newRecordStatus: 'new'
    };

    this.formSubmissionService
      .add(submission)
      .then(() => {
        this.submitted = true;
        notify({ message: 'Thank you! Your submission has been received.', position: 'top', width: 500, type: 'success' });
      })
      .catch(() => {
        notify({ message: 'Something went wrong submitting the form. Please try again.', position: 'top', width: 500, type: 'error' });
      })
      .finally(() => {
        this.submitting = false;
      });
  }
}
