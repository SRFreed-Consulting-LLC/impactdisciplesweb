import { BaseModel } from '@impact-common/shared/models/base.model';
import { FormFieldType } from './form-field.model';

// Trimmed copy of the sibling impactdisciples-admin repo's model of the same
// name. Kept field-for-field identical (including isTest/newRecordStatus,
// which this app never sets) so a submission written here renders in the
// admin app's Custom Form Submissions detail dialog exactly like an
// admin-submitted one - no branching needed there for "which app wrote this".
export class FormSubmissionModel extends BaseModel {
  formId: string;
  formName: string;
  fieldSnapshot: { id: string; label: string; type: FormFieldType }[];
  values: Record<string, unknown>;
  submittedAt: Date;
  isTest?: boolean;
  newRecordStatus?: 'new' | 'seen';
}
