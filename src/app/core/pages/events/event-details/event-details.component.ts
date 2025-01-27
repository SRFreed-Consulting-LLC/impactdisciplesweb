import { EventRegistrationService } from './../../../../../../impactdisciplescommon/src/services/data/event-registration.service';
import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { Subject, takeUntil } from 'rxjs';
import { AgendaItem } from 'impactdisciplescommon/src/models/domain/utils/agenda-item.model';
import { DxFormComponent } from 'devextreme-angular';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { CartItem } from 'impactdisciplescommon/src/models/utils/cart.model';
import { EventService } from 'impactdisciplescommon/src/services/data/event.service';
import { NumberUtil } from 'impactdisciplescommon/src/utils/number-util';
import { AsyncRule } from 'devextreme/common';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.scss']
})
export class EventDetailsComponent implements OnInit, OnDestroy {
  @ViewChildren('attendeeForms') attendeeForms: QueryList<DxFormComponent>;
  event: EventModel;
  total: number = 0;
  cartItem: CartItem;
  groupedAgendaItems: { monthYear: string; days: { date: Date; items: AgendaItem[] }[] }[] = [];

  window = window;

  private ngUnsubscribe = new Subject<void>();

  constructor(private route: ActivatedRoute, private router: Router, private eventService: EventService, private cartService: CartService,
    private eventRegistrationService: EventRegistrationService) {}

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
