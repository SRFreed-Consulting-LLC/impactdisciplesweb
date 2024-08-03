import { Component } from '@angular/core';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'theme-mini-cart',
  templateUrl: './mini-cart.component.html',
  styleUrls: ['./mini-cart.component.scss']
})
export class MiniCartComponent {
  constructor(public cartService: CartService) { }
}
