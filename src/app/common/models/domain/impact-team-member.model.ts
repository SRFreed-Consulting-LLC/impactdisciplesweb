import { OrganizationModel } from "./organization.model";
import { Person } from "./utils/person.model";
import { ImageModel } from "../utils/image.model";

// Split off CoachModel (2026-08, on the impactdisciples-admin side first -
// see that repo's CLAUDE.md/MIGRATION.md for the full writeup). `coaches`
// used to serve 2 unrelated purposes: driving this site's own "My Team"
// page (via a teamPageSortOrder field) and providing Summit breakout-
// session instructors. This model is the public-facing half - whoever
// previously had teamPageSortOrder set on their coach record, moved (not
// copied) into this collection under the same document id by a one-time
// admin-side script, so any link/route already pointing at that id (e.g.
// this site's own /team-details/:id, including from the Summit "Featured
// Speakers" carousel) keeps resolving with no route changes needed here.
//
// `sortOrder` here IS the team page order - there's no second, breakout-
// only sort concept on this model the way CoachModel still has both
// `sortOrder` and `teamPageSortOrder`, because this collection only has
// the one purpose. Breakout-instructor lookups (summit.component.ts/
// summit-preview.component.ts's own coach carousel, schedule.component.ts's
// coach-name lookup) still read the `coaches` collection - unaffected by
// this split, since that data never moved.
export class ImpactTeamMemberModel extends Person {
  isActive = false;
  sortOrder: number;
  fullname: string;
  title: string;
  photoUrl: ImageModel;
  bio: string;
  organization: OrganizationModel | string;
  url: string;

  constructor(){
    super();

    this.fullname = this.firstName + ' ' + this.lastName;
  }
}
