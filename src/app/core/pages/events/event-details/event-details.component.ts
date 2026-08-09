import { EventRegistrationService } from './../../../../../../src/app/common/services/data/event-registration.service';
import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventModel } from 'src/app/common/models/domain/event.model';
import { Subject, takeUntil } from 'rxjs';
import { AgendaItem } from 'src/app/common/models/domain/utils/agenda-item.model';
import { DxFormComponent } from 'devextreme-angular';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { CartItem } from 'src/app/common/models/utils/cart.model';
import { EventService } from 'src/app/common/services/data/event.service';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { AsyncRule } from 'devextreme/common';
import { EventRegistrationModel } from 'src/app/common/models/domain/event-registration.model';
import { Timestamp } from 'firebase/firestore';
import { dateFromTimestamp } from 'src/app/common/utils/date-from-timestamp';
import { EMailModel } from 'src/app/common/models/admin/mail.model';
import { EMailService } from 'src/app/common/services/data/email.service';
import notify from 'devextreme/ui/notify';

@Component({
    selector: 'app-event-details',
    templateUrl: './event-details.component.html',
    styleUrls: ['./event-details.component.scss'],
    standalone: false
})
export class EventDetailsComponent implements OnInit, OnDestroy {
  @ViewChildren('attendeeForms') attendeeForms: QueryList<DxFormComponent>;
  event: EventModel;
  total: number = 0;
  cartItem: CartItem;
  groupedAgendaItems: { monthYear: string; days: { date: Date; items: AgendaItem[] }[] }[] = [];

  window = window;

  private ngUnsubscribe = new Subject<void>();

  constructor(private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private cartService: CartService,
    private eventRegistrationService: EventRegistrationService,
    private emailService: EMailService
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
    this.calculateTotal();
  }

  decrement() {
    if (this.cartItem.attendees.length > 1) {
      this.cartItem.attendees = this.cartItem.attendees.slice(0, -1);
      this.cartItem.orderQuantity = this.cartItem.attendees.length;
      this.calculateTotal();
    }
  }

  proceedToCheckout() {
    let promises: Promise<any>[] = [];

    this.attendeeForms.toArray().forEach(async form => {
      promises.push(form.instance.validate().complete);
    });

    Promise.all(promises).then(results => {
      if(results.every(result => result?.isValid)){
        this.cartService.addCartProduct(this.cartItem);
        this.router.navigate(['/shopping-cart']);
      }
    })
  }

  signUpForEvent() {
    let promises: Promise<any>[] = [];

    this.attendeeForms.toArray().forEach(async form => {
      promises.push(form.instance.validate().complete);
    });

    Promise.all(promises).then(results => {
      if(results.every(result => result?.isValid)){
        this.registerUsers();
      }
    })
  }

  registerUsers(){
      this.attendeeForms.forEach(async attendee => {
        let registration = {... new EventRegistrationModel()};
        registration.eventId = this.event.id;
        registration.firstName = attendee.formData['firstName'];
        registration.lastName = attendee.formData['lastName'];
        registration.email = attendee.formData['email'].toLowerCase();
        registration.registrationDate = Timestamp.now();

        await this.eventService.getById(this.event.id).then(async event => {
          await this.eventRegistrationService.add(registration).then(registration => {
            this.sendRegistrationSuccessEmail(registration, event).then(email => {
              registration.receiptEmailId = email.id;
              return registration;
            }).then(registration => {
              this.eventRegistrationService.update(registration.id, registration);
            }).then(() => {
              notify({
                message: registration.firstName + ' ' + registration.lastName + ' (' + registration.email + ') Registered Successfully for ' + event.eventName +
                ' starting on ' + dateFromTimestamp(event.startDate),
                position: 'top',
                width: 600,
                type: 'success'
              });
            });
          })
        })

        this.cartService.clearCartNoConfirmation();
      })

  }

  sendRegistrationSuccessEmail(registration: EventRegistrationModel, event:EventModel): Promise<EMailModel>{
    let form = {};
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

  alreadyRegisteredValidation: AsyncRule['validationCallback'] = ({ value }) => {
    return this.eventRegistrationService.getEventRegistration(value, this.event.id).then(registrants => {
      if(registrants.length == 0){
        return true
      } else {
        return false;
      }
    })
  };

  uniqueEmailValidation: AsyncRule['validationCallback'] = ({ value }) => {
    let emailaddresses: Map<string, number> = new Map<string, number>();

    this.attendeeForms.toArray().forEach(async form => {
      emailaddresses.set(form.formData['email'], 0);
    });

    if(emailaddresses.has(value)){
      return Promise.resolve(false);
    } else {
      emailaddresses.set(value, 0)
      return Promise.resolve(true);
    }
  };
}
