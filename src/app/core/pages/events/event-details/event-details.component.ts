import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { EventService } from 'impactdisciplescommon/src/services/event.service';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.scss']
})
export class EventDetailsComponent {
  event: EventModel;
  couponCode: string = '';
  quantity: number = 1;
  total: number = 0; 

  constructor( private route: ActivatedRoute, private eventService: EventService, private router: Router){
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.eventService.getById(eventId).then(event => {
        this.event = event;
        this.calculateTotal(); 
      });
    } else {
      this.router.navigate(['/events']);
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

}
