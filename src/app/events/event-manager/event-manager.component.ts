import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { OrganizationService } from 'impactdisciplescommon/src/services/organization.service';
import { LocationService } from 'impactdisciplescommon/src/services/location.service';
import { OrganizationModel } from 'impactdisciplescommon/src/models/domain/organization.model';
import { LocationModel } from 'impactdisciplescommon/src/models/domain/location.model';

@Component({
  selector: 'app-event-manager',
  templateUrl: './event-manager.component.html',
  styleUrls: ['./event-manager.component.css']
})
export class EventManagerComponent implements OnInit {
  @ViewChild('grid', { static: false }) grid: DxDataGridComponent;

  dataSource: any;

  organizations: OrganizationModel[];

  locations: LocationModel[];

  selectedEvent: EventModel;

  constructor(public eventService: EventService, private organizationService: OrganizationService, private locationService: LocationService){
    this.dataSource = new CustomStore({
      key: 'id',
      loadMode: 'raw',
      load: function (loadOptions: any) {
        return eventService.getAll();
      },
      insert: function (value: EventModel) {
        return eventService.add(value);
      },
      update: function (key: any, value: EventModel) {
        return eventService.update(key, value)
      },
      remove: function (id: any) {
        return eventService.delete(id);
      },
    });
  }

  async ngOnInit(): Promise<void> {
    this.organizations = await this.organizationService.getAll();

    this.locations = await this.locationService.getAll();
  }

  onRowUpdating(options) {
    options.newData = Object.assign(options.oldData, options.newData);
  }

  isEditVisible: boolean = false;
  isAgendaVisible: boolean = false;
  isAttendeesListVisible: boolean = false;
  isSessionsVisible: boolean = false;

  editEvent(e){
    this.selectedEvent = e.row.data;
    this.isEditVisible = true;
  }

  editAgenda(e){
    this.selectedEvent = e.row.data;
    this.isAgendaVisible = true;
  }

  editSessions(e){
    this.selectedEvent = e.row.data;
    this.isSessionsVisible = true;
  }

  viewAttendees(e){
    this.selectedEvent = e.row.data;
    this.isAttendeesListVisible = true;
  }
}
