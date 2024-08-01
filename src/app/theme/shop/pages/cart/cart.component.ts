import { Component } from '@angular/core';
import { CartService } from 'src/app/theme/shared/services/cart.service';

@Component({
  selector: 'theme-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {

  couponCode: string = '';
  shipCost: number = 0;

  constructor (public cartService:CartService) {}

  handleCouponSubmit() {
    if(this.couponCode){
      this.couponCode = ''
    }
  }

  handleShippingCost(value: number | string) {
    if (value === 'free') {
      this.shipCost = 0;
    } else {
      this.shipCost = value as number;
    }
  }
}
