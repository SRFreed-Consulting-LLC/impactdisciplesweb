import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { DxFormComponent } from 'devextreme-angular';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { AgendaItem } from 'impactdisciplescommon/src/models/domain/utils/agenda-item.model';
import { CartItem } from 'impactdisciplescommon/src/models/utils/cart.model';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from 'src/app/shared/utils/services/cart.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit, OnDestroy {
  @ViewChildren('attendeeForms') attendeeForms: QueryList<DxFormComponent>;
  event: EventModel;
  total: number = 0;
  cartItem: CartItem;
  groupedAgendaItems: { monthYear: string; days: { date: Date; items: AgendaItem[] }[] }[] = [];

  private ngUnsubscribe = new Subject<void>();

  constructor(private eventService: EventService, private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.eventService.streamAll().pipe(takeUntil(this.ngUnsubscribe)).subscribe((events) => {
      this.event = events.find(event => event.isSummit);
      this.cartItem = {
        id: this.event.id,
        itemName: this.event.eventName,
        orderQuantity: 1,
        isEBook: false,
        price: this.isNan(this.event.costInDollars) ? this.event.costInDollars : 0,
        img: this.event.imageUrl,
        isEvent: true,
        attendees: [{ firstName: '', lastName: '', email: '' }]
      }
      this.calculateTotal();
    })
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
      this.router.navigate(['/registration-checkout']);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public isNan(value){
    if(Number.isNaN(value)){
      return false
    } else {
      return true;
    }
   }

}
