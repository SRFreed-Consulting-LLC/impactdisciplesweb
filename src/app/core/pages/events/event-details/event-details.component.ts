import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventModel } from '@impact-common/shared/models/domain/event.model';
import { Subject, filter, firstValueFrom, take, takeUntil } from 'rxjs';
import { AgendaItem } from '@impact-common/shared/models/domain/utils/agenda-item.model';
// Uses the store's cart (not the old, now-retired CartService) so a paid
// event registration lands in the same cart/checkout the store itself now
// uses -- /shopping-cart and /checkout are the same routes either way, just
// served by the new implementation now (see app-routing.module.ts).
// CheckoutComponent/CheckoutSuccessComponent already handle isEvent
// cart items correctly (ported from the original checkout's own event
// handling), so this is a drop-in swap: same addCartProduct()/
// clearCartNoConfirmation() calls, same CartItem shape.
import { CartService } from 'src/app/core/store/services/cart.service';
import { CartItem } from '@impact-common/shared/models/utils/cart.model';
import { EventService } from 'src/app/common/services/data/event.service';
import { EventRegistrationService } from 'src/app/common/services/data/event-registration.service';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { dateFromTimestamp, toMillis } from '@impact-common/shared/utils/date-from-timestamp';
import { LoggerService } from 'src/app/common/services/data/logger.service';
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
  openIndexes = new Set<number>([0]);

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
    private toastService: ToastService,
    private loggerService: LoggerService,
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
        // The inputs write into attendeesForm (reactive form), not into
        // cartItem.attendees -- copy the typed values over before the cart
        // item is stored, or checkout-success registers empty attendees
        // (the server rejects them with a 400 and nobody gets registered).
        this.cartItem.attendees = this.attendeesForm.controls.map(control => {
          const value = (control as FormGroup).getRawValue();
          return { firstName: value.firstName, lastName: value.lastName, email: value.email };
        });
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

  async registerUsers(){
      // Was: cartService.clearCartNoConfirmation() ran unconditionally after
      // every single attendee, inside a plain forEach that doesn't wait for
      // the async registration call -- so it fired regardless of whether
      // that attendee's registration actually succeeded, and once per
      // attendee rather than once for the whole batch. A failed
      // registration cleared state anyway, contradicting the error toast's
      // own "please try again." Restructured with Promise.all so the batch
      // is awaited as a whole, and the cart is only cleared once, only if
      // at least one attendee actually registered successfully.
      const results = await Promise.all(this.attendeesForm.controls.map(async (control) => {
        const attendeeGroup = control as FormGroup;
        const value = attendeeGroup.getRawValue();

        // Pre-prod #2: one register_for_event Cloud Function call replaces
        // the old client-side create -> template email -> receipt-stamp
        // chain (the function does all three server-side, including the
        // confirmation email carrying the breakout link).
        return this.eventRegistrationService.registerForEvent({
          eventId: this.event.id,
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
        }).then(() => {
          this.toastService.notify({
            message: value.firstName + ' ' + value.lastName + ' (' + String(value.email).toLowerCase() + ') Registered Successfully for ' + this.event.eventName +
            ' starting on ' + dateFromTimestamp(this.event.startDate),
            type: 'success'
          });
          return true;
        }).catch((err) => {
          this.loggerService.logMessage(
            'EVENT_REGISTRATION',
            value.email,
            'Failed to register attendee for event.',
            { err, eventId: this.event.id, eventName: this.event.eventName }
          ).subscribe((errorCode) => {
            this.toastService.notify({
              message: 'We hit a problem registering ' + value.firstName + ' ' + value.lastName +
                ' for ' + this.event.eventName + '. Please try again or contact us - reference code: ' + errorCode,
              type: 'error'
            });
          });
          return false;
        });
      }));

      if (results.some(Boolean)) {
        this.cartService.clearCartNoConfirmation();
      }
  }

  private groupAgendaItemsByMonthAndDate(agendaItems: AgendaItem[]) {
    agendaItems.sort((a, b) => toMillis(a.startDate) - toMillis(b.startDate));

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
    }, {} as Record<string, Record<string, AgendaItem[]>>);

    this.groupedAgendaItems = Object.keys(groupedByMonthYear).map(monthYear => ({
      monthYear: monthYear,
      days: Object.keys(groupedByMonthYear[monthYear])
        .sort((a, b) => toMillis(a) - toMillis(b))
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
    return this.eventRegistrationService.isAlreadyRegistered(control.value, this.event.id).then(exists =>
      exists ? { alreadyRegistered: true } : null
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
