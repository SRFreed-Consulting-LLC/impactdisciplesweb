import { Component, Input, OnInit } from '@angular/core';
import { DxButtonTypes } from 'devextreme-angular/ui/button';
import { CoachModel } from 'impactdisciplescommon/src/models/domain/coach.model';
import { CourseModel } from 'impactdisciplescommon/src/models/domain/course.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { LocationModel } from 'impactdisciplescommon/src/models/domain/location.model';
import { OrganizationModel } from 'impactdisciplescommon/src/models/domain/organization.model';
import { TrainingSessionModel } from 'impactdisciplescommon/src/models/domain/training-session.model';
import { CoachService } from 'impactdisciplescommon/src/services/coach.service';
import { CourseService } from 'impactdisciplescommon/src/services/course.service';
import { LocationService } from 'impactdisciplescommon/src/services/location.service';
import { OrganizationService } from 'impactdisciplescommon/src/services/organization.service';
import { TrainingSessionService } from 'impactdisciplescommon/src/services/training-session.service';

@Component({
  selector: 'app-event-sessions',
  templateUrl: './event-sessions.component.html',
  styleUrls: ['./event-sessions.component.css']
})
export class EventSessionComponent implements OnInit {
  @Input('event') event: EventModel;

  organizations: OrganizationModel[];

  locations: LocationModel[];

  coaches: CoachModel[];

  courses: CourseModel[];

  selectedTrainingSession: TrainingSessionModel;

  eventTrainingSessions: TrainingSessionModel[];

  tabsWithText: Tab[] = [
    {
      id: 0,
      text: 'Training Sessions',
    },
    {
      id: 1,
      text: 'Agenda',
    },
    {
      id: 2,
      text: 'Attendees',
    }
  ];

  selectedTabId = 0;

  addSessionButtonOptions: DxButtonTypes.Properties = {
    icon: 'add',
    text: 'Add Session',
    onClick: () => {
      this.selectedTrainingSession = new TrainingSessionModel();
      this.selectedTrainingSession.eventId = this.event.id;
    },
  };

  saveSessionButtonOptions: DxButtonTypes.Properties = {
    text: 'Save Session',
    onClick: async () => {
      if(this.selectedTrainingSession.id){
        await this.trainingSessionService.update(this.selectedTrainingSession.id, {...this.selectedTrainingSession});
      } else {
        await this.trainingSessionService.add({...this.selectedTrainingSession}).then(training=> {
          this.eventTrainingSessions.push(training);
        });
      }

      this.selectedTrainingSession = null;
    },
  };

  cancelSessionButtonOptions: DxButtonTypes.Properties = {
    text: 'Cancel Session',
    onClick: () => {
      this.selectedTrainingSession = null;
    },
  };

  constructor(private organizationService: OrganizationService, private locationService: LocationService, private coachService: CoachService,
    private courseService: CourseService, private trainingSessionService: TrainingSessionService
  ){}

  async ngOnInit(): Promise<void> {

    this.eventTrainingSessions = await this.trainingSessionService.getAllByValue('eventId', this.event.id);

    this.organizations = await this.organizationService.getAll();

    this.locations = await this.locationService.getAll();

    this.coaches = await this.coachService.getAll();

    this.courses = await this.courseService.getAll();
  }

  editSession(e){
    this.selectedTrainingSession = e.itemData;
  }

  deleteSession(e){
    this.trainingSessionService.delete(e.itemData.id);
  }

  getTrainingSessionDisplayName(e: TrainingSessionModel){
    return e.name;
  }

  getCourseDisplayName(courseId){
    if(!this.courses){
      return '';
    }

    return this.courses.find(course => course.id == courseId).title;
  }

  getCoachDisplayName(coachId){
    if(!this.coaches){
      return '';
    }

    return this.coaches.find(coach => coach.id == coachId).fullname;
  }

  tabClicked(e){
    console.log(e)
    this.selectedTabId = e.itemData.id;
  }
}

export class Tab {
  id: number;

  text?: string;

  icon?: string;
}
