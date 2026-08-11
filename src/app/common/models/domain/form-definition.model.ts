import { BaseModel } from '../base.model';
import { FormControlStyle, FormFieldDef } from './form-field.model';

// Trimmed copy of the sibling impactdisciples-admin repo's model of the same
// name - a form built in that app's Web Manager > Form Builder. This app
// only ever reads one by id (via FormDefinitionService.getById(), see
// DynamicFormComponent) to render it - never creates or edits one.
export class FormDefinitionModel extends BaseModel {
  name: string;
  status: 'draft' | 'published';
  fields: FormFieldDef[];
  backgroundColor?: string;
  controlStyle?: FormControlStyle;
  publicUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
