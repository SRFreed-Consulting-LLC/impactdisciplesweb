import { Person } from "impactdisciplescommon/src/models/domain/utils/person.model";
import { BookLicenseModel } from "./book-license.model";

export class ImpactUser extends Person {
  email: string;
  firebaseUID: string;
  bookLicenses: BookLicenseModel[] = [];
  preferredLanguage?: string;
  version?: string;

  constructor(){
    super();
  }
}
