import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxButtonModule, DxDataGridModule, DxDraggableModule, DxFormModule, DxListModule, DxPopupModule, DxSchedulerModule, DxScrollViewModule, DxSelectBoxModule, DxTabsModule, DxTextAreaModule, DxTextBoxModule } from 'devextreme-angular';
import { EventsPageComponent } from './events-page/events-page.component';
import { EventFormComponent } from './event-form/event-form.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ImpactDisciplesModule } from 'impactdisciplescommon/src/impactdisciples.common.module';
import { EventRegistrationComponent } from './event-registration/event-registration.component';

@NgModule({
  declarations: [
    EventRegistrationComponent,
    EventsPageComponent,
    EventFormComponent
  ],
  imports: [
  CommonModule,
  SharedModule,
  DxButtonModule,
  DxDataGridModule,
  DxDraggableModule,
  DxFormModule,
  DxListModule,
  DxPopupModule,
  DxSchedulerModule,
  DxScrollViewModule,
  DxTabsModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxSelectBoxModule,
  ImpactDisciplesModule,
]
})
export class EventsModule { }
