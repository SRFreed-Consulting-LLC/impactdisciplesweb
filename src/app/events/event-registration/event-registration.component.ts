import { AuthService } from './../../../../impactdisciplescommon/src/services/utils/auth.service';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppUser } from 'impactdisciplescommon/src/models/admin/appuser.model';
import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-event-registration',
  templateUrl: './event-registration.component.html',
  styleUrls: ['./event-registration.component.scss']
})
export class EventRegistrationComponent implements OnInit, OnDestroy {
  eventsList: EventModel[] = [];
  eventRegistration: EventRegistrationModel = new EventRegistrationModel();
  eventRegistrant: AppUser;
  isShowSidePanel: boolean = false;
  selectedEvent: EventModel;

  private ngUnsubscribe = new Subject<void>();

  constructor(private router: Router, private eventService: EventService, private authService: AuthService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.eventService.getAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((events) => {
      this.eventsList = events;
    });


    this.authService.getUser().pipe(takeUntil(this.ngUnsubscribe)).subscribe((user) => {
      this.eventRegistration.registrant = user;
    });
  }

  onEventSelected = ({ selectedItem }) => {
    this.isShowSidePanel = true;
    this.selectedEvent = selectedItem;
    this.cd.markForCheck();
  }

  onRegister = (e) => {
    console.log(e)
    console.log(this.eventRegistration)
    this.authService.findUser(this.eventRegistration.registrant.email).pipe(takeUntil(this.ngUnsubscribe)).subscribe((result) => {
      if(!result) {
        this.router.navigate(['create-auth-form']);
      } else {
        this.router.navigate(['capture-password-form']);
      }
    })
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
