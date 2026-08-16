import { BaseModel } from "src/app/common/models/base.model";
import { Timestamp } from "firebase/firestore";

// A book license never expires. `type`/`length` (always "year"/1) used to
// imply a term, but nothing ever enforced one - the reader app gates content
// on plain membership in libraryUsers.licensedBookIds, a flat array of ids
// with no dates - so they were removed rather than left looking meaningful.
// Licenses end only by explicit revocation (refund, group-license return, or
// an admin revoke), never by elapsed time.
//
// purchaseDate is kept for provenance/display, NOT as an expiry input.
export class BookLicenseModel extends BaseModel {
  purchaseDate: Timestamp;
  bookId: string;
  bookTitle?: string;
  language: string;
}
