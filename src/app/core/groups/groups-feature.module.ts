import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { GroupsSharedModule } from './groups-shared.module';
import { GroupFinderComponent } from './pages/group-finder/group-finder.component';
import { GroupPublicDetailComponent } from './pages/group-public-detail/group-public-detail.component';

const routes: Routes = [
  {
    path: 'impact-groups',
    component: GroupFinderComponent,
    title: 'Find an Impact Group',
  },
  {
    // No literal sibling under 'impact-groups' today, but if one is ever
    // added it must be declared ABOVE this route - ':groupId' would
    // otherwise swallow it. The reader's own group routes carry the same
    // warning for the same reason.
    path: 'impact-groups/:groupId',
    component: GroupPublicDetailComponent,
    title: 'Impact Group',
  },
];

/**
 * The public Impact Group finder. Discovery only: every write (joining a
 * group, creating one) hands off to the Impact Library reader, because
 * `firestore.rules` requires a signed-in identity for all of it and this
 * site has no Firebase Auth.
 */
@NgModule({
  declarations: [GroupFinderComponent, GroupPublicDetailComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    GroupsSharedModule,
    RouterModule.forChild(routes),
  ],
})
export class GroupsFeatureModule {}
