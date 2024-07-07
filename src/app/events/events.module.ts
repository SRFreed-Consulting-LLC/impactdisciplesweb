import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DxButtonModule, DxDataGridModule, DxDraggableModule, DxFormModule, DxListModule, DxPopupModule, DxSchedulerModule, DxScrollViewModule, DxTabsModule, DxTextAreaModule } from 'devextreme-angular';
import { ImpactDisciplesModule } from "../../../impactdisciplescommon/src/impactdisciples.common.module";
import { EventRegistrationComponent } from './event-registration/event-registration.component';

@NgModule({
    declarations: [
        EventRegistrationComponent
    ],
    imports: [
        CommonModule,
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
        ImpactDisciplesModule
    ]
})
export class EventsModule { }
