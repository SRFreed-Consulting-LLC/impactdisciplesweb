import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { YouTubePlayerModule } from '@angular/youtube-player';
import { SharedModule } from "../shared/shared.module";
import { SummitComponent } from "./pages/summit/summit.component";

const routes: Routes = [
  {
    path: 'summit/:year',
    component: SummitComponent,
    title: 'Summit'
  },
  {
    // Same component, isActive filter lifted - see SummitComponent.
    // Deliberately unlinked from the site: a staff-only way to see a
    // summit before it is activated.
    path: 'summit-preview/:year',
    component: SummitComponent,
    data: { preview: true }
  }
];

@NgModule({
  declarations: [
    SummitComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    YouTubePlayerModule,
    RouterModule.forChild(routes)
  ]
})
export class SummitFeatureModule { }
