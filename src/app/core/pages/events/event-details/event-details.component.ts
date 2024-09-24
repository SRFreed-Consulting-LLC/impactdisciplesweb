import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { Subject, takeUntil } from 'rxjs';
import { AgendaItem } from 'impactdisciplescommon/src/models/domain/utils/agenda-item.model';
import { DxFormComponent } from 'devextreme-angular';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { CartItem } from 'impactdisciplescommon/src/models/utils/cart.model';

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

  private ngUnsubscribe = new Subject<void>();

  constructor(private route: ActivatedRoute, private router: Router, private eventService: EventService, private cartService: CartService) {}

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.eventService.streamById(eventId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((event) => {
        this.event = event;
        this.cartItem = {
          id: event.id,
          itemName: event.eventName,
          orderQuantity: 1,
          price: event.costInDollars,
          img: event.imageUrl,
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
    const isValid = this.attendeeForms.toArray().every(form => form.instance.validate().isValid);

    if (isValid) {
      this.cartService.addCartProduct(this.cartItem)
      this.router.navigate(['/shopping-cart']);
    }
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

}
