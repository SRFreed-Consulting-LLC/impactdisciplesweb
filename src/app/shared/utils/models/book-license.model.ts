import { BaseModel } from "impactdisciplescommon/src/models/base.model";

export class BookLicenseModel extends BaseModel {
  purchaseDate: any;
  bookId: string;
  bookTitle?: string;
  type: string;
  language: string;
  length: number;
}
