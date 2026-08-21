import { OrganizationModel } from "./organization.model";
import { Person } from "@impact-common/shared/models/domain/utils/person.model";
import { ImageModel } from "@impact-common/shared/models/utils/image.model";

export class CoachModel extends Person {
  isActive = false;
  sortOrder: number;
  teamPageSortOrder: number;
  fullname: string;
  title: string;
  photoUrl: ImageModel;
  bio: string
  organization: OrganizationModel | string;
  url: string;

  constructor(){
    super();

    this.fullname = this.firstName + ' ' + this.lastName;
  }
}
