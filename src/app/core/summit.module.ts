import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { YouTubePlayerModule } from '@angular/youtube-player';
import {
  DxButtonModule, DxNumberBoxModule, DxAccordionModule, DxFormModule, DxDateBoxModule,
  DxAutocompleteModule, DxTextAreaModule, DxRadioGroupModule, DxSelectBoxModule,
  DxLoadIndicatorModule, DxCheckBoxModule, DxTextBoxModule, DxLookupModule, DxLoadPanelModule,
  DxDataGridModule, DxPopupModule, DxGalleryModule, DxValidatorModule, DxTabsModule
} from "devextreme-angular";
import { SharedModule } from "../shared/shared.module";
import { SummitComponent } from "./pages/summit/summit.component";
import { SummitPreviewComponent } from "./pages/summit-preview/summit-preview.component";

const routes: Routes = [
  {
    path: 'summit/:year',
    component: SummitComponent
  },
  {
    path: 'summit-preview/:year',
    component: SummitPreviewComponent
  }
];

@NgModule({
  declarations: [
    SummitComponent,
    SummitPreviewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    YouTubePlayerModule,
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
export class SummitFeatureModule { }
