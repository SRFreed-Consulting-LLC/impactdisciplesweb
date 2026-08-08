import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import {
  DxButtonModule, DxNumberBoxModule, DxAccordionModule, DxFormModule, DxDateBoxModule,
  DxAutocompleteModule, DxTextAreaModule, DxRadioGroupModule, DxSelectBoxModule,
  DxLoadIndicatorModule, DxCheckBoxModule, DxTextBoxModule, DxLookupModule, DxLoadPanelModule,
  DxDataGridModule, DxPopupModule, DxGalleryModule, DxValidatorModule, DxTabsModule
} from "devextreme-angular";
import { SharedModule } from "../shared/shared.module";
import { TeamComponent } from "./pages/team/team.component";
import { TeamDetailsComponent } from "./pages/team/team-details/team-details.component";

const routes: Routes = [
  {
    path: 'team',
    component: TeamComponent
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
    DxNumberBoxModule,
    DxAccordionModule,
    DxButtonModule,
    DxDataGridModule,
    DxFormModule,
    DxValidatorModule,
    DxTabsModule,
    DxDateBoxModule,
    DxAutocompleteModule,
    DxLoadPanelModule,
    DxLookupModule,
    DxPopupModule,
    DxRadioGroupModule,
    DxTextAreaModule,
    DxSelectBoxModule,
    DxLoadIndicatorModule,
    DxCheckBoxModule,
    DxTextBoxModule,
    DxGalleryModule,
    RouterModule.forChild(routes)
  ]
})
export class TeamFeatureModule { }
