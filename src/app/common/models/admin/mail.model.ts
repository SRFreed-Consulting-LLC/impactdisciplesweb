import { Timestamp } from 'firebase/firestore';
import { BaseModel } from '../base.model';

export class MailTemplateModel extends BaseModel {
  name: string
  subject: string;
  html: string;
  attachments: unknown[];
}

export class EMailModel extends BaseModel {
  date: Timestamp;
  to: string;
  message?: MessageModel;
  template?: TemplateModel
}

export class MessageModel{
  subject: string;
  text?: string;
  html?: string;
}

export class TemplateModel {
  name: string
  // The template-substitution model, not a literal string despite the name -
  // was typed string with `any` actually being assigned here for its only
  // real usage (email.service.ts's sendTemplateEmail()); fixed the type to
  // match reality rather than guessing at a stringify that could change
  // whatever server-side process consumes this doc.
  data: Record<string, string>;
}
