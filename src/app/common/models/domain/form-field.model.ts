// Trimmed copy of the same file in the sibling impactdisciples-admin repo
// (src/app/common/models/domain/form-field.model.ts) - that app owns the
// Form Builder (palette, canvas, settings panel) and is the source of truth
// for this shape; this app only ever RENDERS a FormFieldDef[] a form author
// already built there, via app-dynamic-form (src/app/shared/form-renderer/).
// Deliberately does not carry over anything builder-only - FIELD_TYPE_META,
// palette groups, createFieldDef/setColumnCount (all editing concerns) -
// since this app never constructs or edits a FormFieldDef, only reads one.
// Keep field-by-field in sync with the admin copy by hand if that shape
// changes - same "independent copy, can drift" arrangement this repo's
// common/ folder already has for FirebaseDAO/BaseService.
export type FormFieldType =
  | 'text'
  | 'paragraph'
  | 'number'
  | 'checkbox'
  | 'checkboxes'
  | 'radio'
  | 'dropdown'
  | 'email'
  | 'phone'
  | 'address'
  | 'date'
  | 'time'
  | 'datetime'
  | 'url'
  | 'rating'
  | 'heading'
  | 'instructions'
  | 'image'
  | 'divider'
  | 'columns';

export interface FormFieldOption {
  label: string;
  value: string;
}

export type FieldFontSize = 'small' | 'medium' | 'large' | 'x-large';
export type FieldFontFamily = 'default' | 'serif' | 'sans-serif' | 'monospace';
export type FieldAlign = 'left' | 'center' | 'right';

export interface FormFieldStyle {
  textColor?: string;
  fontSize?: FieldFontSize;
  fontFamily?: FieldFontFamily;
  align?: FieldAlign;
  bold?: boolean;
  italic?: boolean;
}

export type LabelDisplay = 'label' | 'placeholder';
export type ImageWidth = 'small' | 'medium' | 'large' | 'full';

// See the admin copy's own comment - wrapped in an object (not a bare
// FormFieldDef[][]) because Firestore rejects an array whose elements are
// themselves arrays.
export interface FormFieldColumn {
  fields: FormFieldDef[];
}

export interface FormFieldDef {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: FormFieldOption[];
  html?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: ImageWidth;
  style?: FormFieldStyle;
  labelDisplay?: LabelDisplay;
  columns?: FormFieldColumn[];
}

// Structural types with no submitted value of their own - build-form-group.ts
// skips these when constructing controls, dynamic-form-field.component.ts
// renders them as static content rather than an input.
const LAYOUT_FIELD_TYPES: FormFieldType[] = ['heading', 'instructions', 'image', 'divider', 'columns'];

export function isLayoutFieldType(type: FormFieldType): boolean {
  return LAYOUT_FIELD_TYPES.includes(type);
}

// CSS values behind each style preset - same mapping as the admin copy.
export const FONT_SIZE_CSS: Record<FieldFontSize, string> = {
  small: '13px',
  medium: '15px',
  large: '19px',
  'x-large': '24px'
};

export const FONT_FAMILY_CSS: Record<FieldFontFamily, string> = {
  default: '',
  serif: 'Georgia, "Times New Roman", serif',
  'sans-serif': 'Arial, Helvetica, sans-serif',
  monospace: '"Courier New", Courier, monospace'
};

export const IMAGE_WIDTH_CSS: Record<ImageWidth, string> = {
  small: '200px',
  medium: '400px',
  large: '600px',
  full: '100%'
};

// Builds an [ngStyle]-ready object from a field's style overrides - same
// logic as the admin renderer's own fieldStyleObject().
export function fieldStyleObject(style?: FormFieldStyle): Record<string, string> {
  if (!style) {
    return {};
  }
  const out: Record<string, string> = {};
  if (style.textColor) {
    out['color'] = style.textColor;
  }
  if (style.fontSize) {
    out['font-size'] = FONT_SIZE_CSS[style.fontSize];
  }
  if (style.fontFamily && style.fontFamily !== 'default') {
    out['font-family'] = FONT_FAMILY_CSS[style.fontFamily];
  }
  if (style.align) {
    out['text-align'] = style.align;
  }
  if (style.bold) {
    out['font-weight'] = 'bold';
  }
  if (style.italic) {
    out['font-style'] = 'italic';
  }
  return out;
}

// text/paragraph/number/email/url only - see the admin copy's own comment.
const LABEL_DISPLAY_TYPES: FormFieldType[] = ['text', 'paragraph', 'number', 'email', 'url'];

export function supportsLabelDisplay(type: FormFieldType): boolean {
  return LABEL_DISPLAY_TYPES.includes(type);
}

// Flattens a fields[] tree into just its data-collecting fields (skipping
// layout types, recursing into every 'columns' field's arrays) - the field
// list a submission's values/fieldSnapshot actually needs.
export function flattenDataFields(fields: FormFieldDef[]): FormFieldDef[] {
  const result: FormFieldDef[] = [];
  for (const field of fields) {
    if (field.type === 'columns') {
      (field.columns ?? []).forEach((column) => result.push(...flattenDataFields(column.fields)));
      continue;
    }
    if (!isLayoutFieldType(field.type)) {
      result.push(field);
    }
  }
  return result;
}
