import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormComponent } from './dynamic-form.component';
import { DynamicFormFieldComponent } from './dynamic-form-field.component';

// The Form Builder renderer, split out of SharedModule (bucket A, web item
// 8, 2026-08-21).
//
// SharedModule is imported by AppModule AND by every lazy feature module,
// so everything declared in it lands in the INITIAL bundle - including
// this, which only three pages use (contact, the form pages, seminars),
// all of them inside ContentFeatureModule. Declaring it here and importing
// it only there keeps it in that lazy chunk.
//
// If a second feature module ever needs a Form Builder form, import this
// module there too rather than moving these back into SharedModule.
@NgModule({
  declarations: [
    DynamicFormComponent,
    DynamicFormFieldComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    DynamicFormComponent,
    DynamicFormFieldComponent
  ]
})
export class FormRendererModule { }
