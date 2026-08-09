import { BaseModel } from "src/app/common/models/base.model";

export class BookLicenseModel extends BaseModel {
  purchaseDate: any;
  bookId: string;
  bookTitle?: string;
  type: string;
  language: string;
  length: number;
}
