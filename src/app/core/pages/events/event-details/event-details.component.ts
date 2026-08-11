import { EventRegistrationService } from './../../../../../../src/app/common/services/data/event-registration.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { Subject, filter, firstValueFrom, take, takeUntil } from 'rxjs';
import { AgendaItem } from 'src/app/common/models/domain/utils/agenda-item.model';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { CartItem } from 'src/app/common/models/utils/cart.model';
import { EventService } from 'src/app/common/services/data/event.service';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { EventRegistrationModel } from 'src/app/common/models/domain/event-registration.model';
import { Timestamp } from 'firebase/firestore';
import { dateFromTimestamp } from 'src/app/common/utils/date-from-timestamp';
import { EMailModel } from 'src/app/common/models/admin/mail.model';
import { EMailService } from 'src/app/common/services/data/email.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';

@Component({
    selector: 'app-event-details',
    templateUrl: './event-details.component.html',
    styleUrls: ['./event-details.component.scss'],
    standalone: false
})
export class EventDetailsComponent implements OnInit, OnDestroy {
  // Replaces DxAccordion + per-attendee DxForm + QueryList<DxFormComponent> --
  // one FormGroup per attendee, in a FormArray kept in lockstep with
  // cartItem.attendees (see increment()/decrement()). openIndexes tracks
  // which attendee sections are expanded, same [multiple]="true"
  // [selectedIndex]="0" behavior as the old dx-accordion (first one open,
  // each independently toggleable, unlike the single-open accordion used
  // elsewhere in this app).
  attendeesForm: FormArray = this.fb.array([]);
  openIndexes: Set<number> = new Set([0]);

  event: EventModel;
  total = 0;
  cartItem: CartItem;
  groupedAgendaItems: { monthYear: string; days: { date: Date; items: AgendaItem[] }[] }[] = [];

  window = window;

  private ngUnsubscribe = new Subject<void>();

  constructor(private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private cartService: CartService,
    private eventRegistrationService: EventRegistrationService,
    private emailService: EMailService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');

    if (eventId) {
      this.eventService.streamById(eventId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((event) => {
        this.event = event[0];
        this.cartItem = {
          id: this.event.id,
          itemName: this.event.eventName,
          orderQuantity: 1,
          price: NumberUtil.isNumber(this.event.costInDollars)?this.event.costInDollars : 0,
          img: this.event.imageUrl,
          isEBook: false,
          isEvent: true,
          isDigitalBook: false,
          attendees: [{ firstName: '', lastName: '', email: '' }]
        }
        this.attendeesForm = this.fb.array([this.buildAttendeeGroup()]);
        this.openIndexes = new Set([0]);
        if(this.event.agendaItems) {
          this.groupAgendaItemsByMonthAndDate(this.event.agendaItems);
        }
        this.calculateTotal();
      })
    } else {
      this.router.navigate(['/events']);
    }
  }

  calculateTotal() {
    if (this.event && this.event.costInDollars) {
      this.total = this.event.costInDollars * this.cartItem.orderQuantity;
    }
  }

  increment() {
    this.cartItem.attendees = [...this.cartItem.attendees, { firstName: '', lastName: '', email: '' }];
    this.cartItem.orderQuantity = this.cartItem.attendees.length;
    this.attendeesForm.push(this.buildAttendeeGroup());
    this.calculateTotal();
  }

  decrement() {
    if (this.cartItem.attendees.length > 1) {
      this.cartItem.attendees = this.cartItem.attendees.slice(0, -1);
      this.cartItem.orderQuantity = this.cartItem.attendees.length;
      this.attendeesForm.removeAt(this.attendeesForm.length - 1);
      this.openIndexes.delete(this.attendeesForm.length);
      this.calculateTotal();
    }
  }

  private buildAttendeeGroup(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required], [this.alreadyRegisteredValidator, this.uniqueEmailValidator]]
    });
  }

  toggleAttendee(index: number): void {
    if (this.openIndexes.has(index)) {
      this.openIndexes.delete(index);
    } else {
      this.openIndexes.add(index);
    }
  }

  // Replaces DxForm's .instance.validate().complete -- Angular reports a
  // control's status as 'PENDING' while its async validators are still
  // running, so this waits for the first non-PENDING status (triggered by
  // updateValueAndValidity(), which re-runs both sync and async validators)
  // before reading .valid, same "wait for every attendee's async checks,
  // then decide" shape the old Promise.all(...complete) had.
  private async validateAttendees(): Promise<boolean> {
    this.attendeesForm.markAllAsTouched();
    this.attendeesForm.updateValueAndValidity();

    if (this.attendeesForm.status === 'PENDING') {
      await firstValueFrom(this.attendeesForm.statusChanges.pipe(filter(status => status !== 'PENDING'), take(1)));
    }

    return this.attendeesForm.valid;
  }

  proceedToCheckout() {
    this.validateAttendees().then(isValid => {
      if (isValid) {
        this.cartService.addCartProduct(this.cartItem);
        this.router.navigate(['/shopping-cart']);
      }
    });
  }

  signUpForEvent() {
    this.validateAttendees().then(isValid => {
      if (isValid) {
        this.registerUsers();
      }
    });
  }

  registerUsers(){
      this.attendeesForm.controls.forEach(async (control) => {
        const attendeeGroup = control as FormGroup;
        const value = attendeeGroup.getRawValue();
        const registration = {... new EventRegistrationModel()};
        registration.eventId = this.event.id;
        registration.firstName = value.firstName;
        registration.lastName = value.lastName;
        registration.email = value.email.toLowerCase();
        registration.registrationDate = Timestamp.now();

        await this.eventService.getById(this.event.id).then(async event => {
          await this.eventRegistrationService.add(registration).then(registration => {
            this.sendRegistrationSuccessEmail(registration, event).then(email => {
              registration.receiptEmailId = email.id;
              return registration;
            }).then(registration => {
              this.eventRegistrationService.update(registration.id, registration);
            }).then(() => {
              this.toastService.notify({
                message: registration.firstName + ' ' + registration.lastName + ' (' + registration.email + ') Registered Successfully for ' + event.eventName +
                ' starting on ' + dateFromTimestamp(event.startDate),
                type: 'success'
              });
            });
          })
        })

        this.cartService.clearCartNoConfirmation();
      })

  }

  sendRegistrationSuccessEmail(registration: EventRegistrationModel, event:EventModel): Promise<EMailModel>{
    const form = {};
    form['firstName'] = registration.firstName;
    form['lastName'] = registration.lastName;
    form['email'] = registration.email;
    form['eventName'] = event.eventName;
    form['startDate'] = new Date(event.startDate as string).toLocaleDateString() + " at " + new Date(event.startDate as string).toLocaleTimeString();

    return this.emailService.sendTemplateEmail(registration.email, event.emailTemplate, form);
  }

  private groupAgendaItemsByMonthAndDate(agendaItems: AgendaItem[]) {
    agendaItems.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const groupedByMonthYear = agendaItems.reduce((acc, item) => {
      const monthYearKey = new Date(item.startDate).toLocaleString('default', { month: 'long', year: 'numeric' });
      const dateKey = new Date(item.startDate).toDateString();

      if (!acc[monthYearKey]) {
        acc[monthYearKey] = {};
      }

      if (!acc[monthYearKey][dateKey]) {
        acc[monthYearKey][dateKey] = [];
      }

      acc[monthYearKey][dateKey].push(item);
      return acc;
    }, {} as { [monthYear: string]: { [date: string]: AgendaItem[] } });

    this.groupedAgendaItems = Object.keys(groupedByMonthYear).map(monthYear => ({
      monthYear: monthYear,
      days: Object.keys(groupedByMonthYear[monthYear])
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map(date => ({
          date: new Date(date),
          items: groupedByMonthYear[monthYear][date],
        })),
    }));
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  // Replaces the AsyncRule['validationCallback'] pair below with standard
  // Angular AsyncValidatorFns (exactly what that DevExtreme type was doing
  // under the hood) -- arrow-function class fields, same as before, so
  // `this` stays bound when passed as a bare reference into buildAttendeeGroup().
  alreadyRegisteredValidator = (control: AbstractControl): Promise<ValidationErrors | null> => {
    if (!control.value || !this.event) {
      return Promise.resolve(null);
    }
    return this.eventRegistrationService.getEventRegistration(control.value, this.event.id).then(registrants =>
      registrants.length === 0 ? null : { alreadyRegistered: true }
    );
  };

  // Checks the current control's value against every OTHER attendee's email
  // in attendeesForm (excluding itself -- the original DevExtreme version's
  // equivalent loop included the field's own current form in the set it
  // checked membership against, which would flag every non-empty email as
  // a duplicate of itself; excluding self here is the behavior the
  // "Each email registered must be unique!" message clearly intends).
  uniqueEmailValidator = (control: AbstractControl): Promise<ValidationErrors | null> => {
    const value = control.value;
    if (!value) {
      return Promise.resolve(null);
    }
    const isDuplicate = this.attendeesForm.controls.some(group => group !== control.parent && (group as FormGroup).get('email')?.value === value);
    return Promise.resolve(isDuplicate ? { duplicateEmail: true } : null);
  };
}
