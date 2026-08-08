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
import { EventsComponent } from "./pages/events/events.component";
import { EventDetailsComponent } from "./pages/events/event-details/event-details.component";
import { ScheduleComponent } from "./pages/schedule/schedule.component";
import { BreakoutSessionsComponent } from "./pages/schedule/breakout-sessions/breakout-sessions.component";
import { CourseModalComponent } from "./pages/schedule/course-modal/course-modal.component";

const routes: Routes = [
  {
    path: 'events',
    component: EventsComponent
  },
  {
    path: 'event-details/:id',
    component: EventDetailsComponent
  },
  {
    path: 'events/:event-id/registrations/:registration-id',
    component: ScheduleComponent
  }
];

@NgModule({
  declarations: [
    EventsComponent,
    EventDetailsComponent,
    ScheduleComponent,
    BreakoutSessionsComponent,
    CourseModalComponent
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
export class EventsFeatureModule { }
