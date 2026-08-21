import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "../shared/shared.module";
import { TeamComponent } from "./pages/team/team.component";
import { TeamDetailsComponent } from "./pages/team/team-details/team-details.component";

const routes: Routes = [
  {
    path: 'team',
    component: TeamComponent,
    title: 'Team'
  },
  {
    path: 'team-details/:id',
    component: TeamDetailsComponent
  }
];

@NgModule({
  declarations: [
    TeamComponent,
    TeamDetailsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class TeamFeatureModule { }
