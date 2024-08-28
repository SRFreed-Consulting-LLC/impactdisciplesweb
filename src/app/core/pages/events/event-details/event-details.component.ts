import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { ShoppingCartService } from '../../event-checkout/event-checkout.service';
import { Subject, takeUntil } from 'rxjs';
import { AgendaItem } from 'impactdisciplescommon/src/models/domain/utils/agenda-item.model';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.scss']
})
export class EventDetailsComponent implements OnDestroy {
  event: EventModel;
  couponCode: string = '';
  quantity: number = 1;
  total: number = 0; 

  groupedAgendaItems: { monthYear: string; days: { date: Date; items: AgendaItem[] }[] }[] = [];

  private ngUnsubscribe = new Subject<void>();

  constructor( private route: ActivatedRoute, private eventService: EventService, private router: Router, private shoppingCartService: ShoppingCartService){
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.eventService.streamById(eventId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((event) => {
        this.event = event;
        if(this.event.agendaItems) {
          this.groupAgendaItemsByMonthAndDate(this.event.agendaItems);
        }
        console.log(event)
        this.calculateTotal(); 
      })
    } else {
      this.router.navigate(['/events']);
    }
  }

  groupAgendaItemsByMonthAndDate(agendaItems: AgendaItem[]) {
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

  proceedToCheckout() {
    if (this.event) {
      this.shoppingCartService.setCartItem({
        eventId: this.event.id,
        eventName: this.event.eventName,
        price: this.event.costInDollars,
        quantity: this.quantity
      });
      this.router.navigate(['/event-checkout']);
    }
  }

  increment() {
    this.quantity++;
    this.calculateTotal();
  }

  decrement() {
    if (this.quantity > 1) {
      this.quantity--;
      this.calculateTotal();
    }
  }

  calculateTotal() {
    if (this.event && this.event.costInDollars) {
      this.total = this.event.costInDollars * this.quantity;
    }
  }

  handleCouponSubmit() {
    if(this.couponCode){
      this.couponCode = ''
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
