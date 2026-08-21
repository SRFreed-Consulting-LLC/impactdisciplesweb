import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { YouTubePlayerModule } from '@angular/youtube-player';
import { SharedModule } from "../shared/shared.module";
import { EventsComponent } from "./pages/events/events.component";
import { EventDetailsComponent } from "./pages/events/event-details/event-details.component";
import { ScheduleComponent } from "./pages/schedule/schedule.component";
import { BreakoutSessionsComponent } from "./pages/schedule/breakout-sessions/breakout-sessions.component";

const routes: Routes = [
  {
    path: 'events',
    component: EventsComponent,
    title: 'Upcoming Training'
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
    BreakoutSessionsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    YouTubePlayerModule,
    RouterModule.forChild(routes)
  ]
})
export class EventsFeatureModule { }
