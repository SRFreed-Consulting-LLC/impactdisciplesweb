import { Component } from '@angular/core';
import { CartService } from '../../utils/services/cart.service';

@Component({
  selector: 'app-mini-cart',
  templateUrl: './mini-cart.component.html',
  styleUrls: ['./mini-cart.component.scss']
})
export class MiniCartComponent {
   constructor(public cartService: CartService) { }

   public isNan(value){
    if(Number.isNaN(value)){
      return false
    } else {
      return true;
    }
   }
}
