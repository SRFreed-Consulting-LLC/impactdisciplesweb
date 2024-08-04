import { LocationService } from './../../../../impactdisciplescommon/src/services/location.service';
import { AuthService } from './../../../../impactdisciplescommon/src/services/utils/auth.service';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppUser } from 'impactdisciplescommon/src/models/admin/appuser.model';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { LocationModel } from 'impactdisciplescommon/src/models/domain/location.model';
import { OrganizationModel } from 'impactdisciplescommon/src/models/domain/organization.model';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { OrganizationService } from 'impactdisciplescommon/src/services/organization.service';
import { SessionService } from 'impactdisciplescommon/src/services/utils/session.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-event-registration',
  templateUrl: './event-registration.component.html',
  styleUrls: ['./event-registration.component.scss']
})
export class EventRegistrationComponent implements OnInit, OnDestroy {
  eventsList: EventModel[] = [];
  locationsList: LocationModel[] = [];
  organizationsList: OrganizationModel[] = [];
  eventRegistration: EventRegistrationModel = new EventRegistrationModel();
  eventRegistrant: AppUser;
  isShowSidePanel: boolean = false;
  selectedEvent: EventModel;

  private ngUnsubscribe = new Subject<void>();

  constructor(private router: Router, private eventService: EventService, private authService: AuthService, private cd: ChangeDetectorRef,
    private locationService: LocationService, private organizationService: OrganizationService, private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.eventService.getAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((events) => {
      this.eventsList = events;

      events.forEach(event => {
        event.agendaItems.sort((a,b) => {
          return a.startDate.getTime() - b.startDate.getTime();
        })
      })
    });

    this.authService.getUser().pipe(takeUntil(this.ngUnsubscribe)).subscribe((user) => {
      this.eventRegistration.registrant = user;
    });

    this.locationService.getAll().then((locations) => {
      this.locationsList = locations;
    });

    this.organizationService.getAll().then((organizations) => {
      this.organizationsList = organizations;
    });
  }

  onEventSelected = ({ selectedItem }) => {
    this.isShowSidePanel = true;
    this.selectedEvent = selectedItem;
    this.cd.markForCheck();
  }

  onRegister = (e) => {
    console.log(e)
    console.log(this.eventRegistration);
    this.authService.lastAuthenticatedPath = 'event-form'; 
    this.authService.findUser(this.eventRegistration.registrant.email).pipe(takeUntil(this.ngUnsubscribe)).subscribe((result) => {
      if(!result) {
        this.router.navigate(['create-auth-form']);
      } else {
        this.sessionService.currentUser = result;
        this.router.navigate(['capture-password-form']);
      }
    })
  }

  getLocation(id): string{
    let location = this.locationsList.find(location => location.id == id);

    if(location?.organization){
      let organization = this.organizationsList.find(org => org.id == location.organization);

      return organization.name + ' (' + location.name + ')'
    }

    return location.name;

  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
