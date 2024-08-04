import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DxButtonModule, DxDataGridModule, DxDraggableModule, DxFormModule, DxListModule, DxPopupModule, DxSchedulerModule, DxScrollViewModule, DxSelectBoxModule, DxTabsModule, DxTextAreaModule, DxTextBoxModule } from 'devextreme-angular';
import { ImpactDisciplesModule } from "../../../impactdisciplescommon/src/impactdisciples.common.module";
import { EventRegistrationComponent } from './event-registration/event-registration.component';
import { EventsPageComponent } from './events-page/events-page.component';
import { SharedModule } from "../shared/shared.module";

@NgModule({
    declarations: [
        EventRegistrationComponent,
        EventsPageComponent
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
    ImpactDisciplesModule
]
})
export class EventsModule { }
