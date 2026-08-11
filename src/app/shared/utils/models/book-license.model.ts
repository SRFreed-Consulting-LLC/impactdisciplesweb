import { BaseModel } from "src/app/common/models/base.model";
import { Timestamp } from "firebase/firestore";

export class BookLicenseModel extends BaseModel {
  purchaseDate: Timestamp;
  bookId: string;
  bookTitle?: string;
  type: string;
  language: string;
  length: number;
}
