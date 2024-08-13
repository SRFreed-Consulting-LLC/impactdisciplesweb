
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppUser } from 'impactdisciplescommon/src/models/admin/appuser.model';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { LocationModel } from 'impactdisciplescommon/src/models/domain/location.model';
import { OrganizationModel } from 'impactdisciplescommon/src/models/domain/organization.model';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { LocationService } from 'impactdisciplescommon/src/services/location.service';
import { OrganizationService } from 'impactdisciplescommon/src/services/organization.service';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
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
  incomingEventId: string;

  private ngUnsubscribe = new Subject<void>();

  constructor(private router: Router, private eventService: EventService, private authService: AuthService, private cd: ChangeDetectorRef,
    private locationService: LocationService, private organizationService: OrganizationService, private sessionService: SessionService, private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authService.getUser().pipe(takeUntil(this.ngUnsubscribe)).subscribe((user) => {
      this.eventRegistration.registrant = user;
    });

    this.locationService.getAll().then((locations) => {
      this.locationsList = locations;
    });

    this.organizationService.getAll().then((organizations) => {
      this.organizationsList = organizations;
    });

    this.incomingEventId = this.route.snapshot.queryParamMap.get('id');

    if(this.incomingEventId){
      this.eventService.getById(this.incomingEventId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((event) => {
        this.onEventSelected({selectedItem: {...event}});
      });
    } else {
      this.eventService.getAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((events) => {
        this.eventsList = events;
      });
    }
  }

  onEventSelected = ({ selectedItem }) => {
    this.isShowSidePanel = true;
    this.selectedEvent = selectedItem;

    this.selectedEvent.agendaItems.sort((a,b) => a.startDate.getTime() - b.startDate.getTime())
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

  getLocationName(id): string{
    let location = this.locationsList.find(location => location.id == id);

    if(location?.organization){
      let organization = this.organizationsList.find(org => org.id == location.organization);

      return organization.name + ' (' + location.name + ')'
    }

    return location.name;

  }

  getSelectedLocation(id): LocationModel{
    return this.locationsList.find(location => location.id == id);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
