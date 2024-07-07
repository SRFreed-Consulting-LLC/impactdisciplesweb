import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { dateFromTimestamp } from './../../../../../impactdisciplescommon/src/utils/date-from-timestamp';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DxDraggableTypes } from 'devextreme-angular/ui/draggable';
import { DxSchedulerTypes } from 'devextreme-angular/ui/scheduler';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { TrainingSessionModel } from 'impactdisciplescommon/src/models/domain/training-session.model';
import { TrainingSessionService } from 'impactdisciplescommon/src/services/training-session.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-event-agenda',
  templateUrl: './event-agenda.component.html',
  styleUrls: ['./event-agenda.component.css']
})
export class EventAgendaComponent implements OnInit{
  @Input('event') event: EventModel;
  @Output() onCloseWindow = new  EventEmitter<boolean>();

  draggingGroupName = 'appointmentsGroup';

  currentDate: Date;

  availableTrainingSessions: TrainingSessionModel[] = [];

  constructor(private eventService: EventService, private traininSessionService: TrainingSessionService, private toastrService: ToastrService){}

  async ngOnInit(): Promise<void> {
    if(!this.event.agendaItems){
      this.event.agendaItems = [];
    }
    this.currentDate = dateFromTimestamp(this.event.startDate);

    this.availableTrainingSessions = await this.traininSessionService.getAllByValue('eventId', this.event.id).then(sessions =>{
      let retval:TrainingSessionModel[] = [];

      sessions.forEach(session => {
        if(!this.event.agendaItems.find(agenda => agenda.id == session.id)){
          retval.push(session);
        }
      })


      return retval;
    });
  }

  onAppointmentAdd = (e: DxSchedulerTypes.AppointmentDraggingAddEvent) => {
    const index = this.availableTrainingSessions.indexOf(e.fromData);

    if (index >= 0) {
      this.availableTrainingSessions.splice(index, 1);
      this.event.agendaItems.push(e.itemData);
    }
  };

  onAppointmentRemove = (e: DxSchedulerTypes.AppointmentDraggingRemoveEvent) => {
    const index = this.event.agendaItems.indexOf(e.itemData);

    if (index >= 0) {
      this.event.agendaItems.splice(index, 1);
      this.availableTrainingSessions.push(e.itemData);
    }
  };

  onListDragStart(e: DxDraggableTypes.DragStartEvent) {
    e.cancel = true;
  }

  onItemDragStart(e: DxDraggableTypes.DragStartEvent) {
    e.itemData = e.fromData;
  }

  onItemDragEnd(e: DxDraggableTypes.DragEndEvent) {
    if (e.toData) {
      e.cancel = true;
    }
  }

  removeAgendaItem(e){
    if(e.appointmentData.id){
      this.availableTrainingSessions.push(e.appointmentData);
    }
  }

  saveAgenda(){
    this.eventService.update(this.event.id, this.event).then(event => {
      this.toastrService.success('Event Saved!');
      this.onCloseWindow.emit(false);
    })
  }
}
