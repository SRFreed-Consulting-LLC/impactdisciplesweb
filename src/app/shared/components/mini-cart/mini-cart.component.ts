import { Component } from '@angular/core';
import { CartService } from '../../utils/services/cart.service';
import { NumberUtil } from 'impactdisciplescommon/src/utils/number-util';

@Component({
  selector: 'app-mini-cart',
  templateUrl: './mini-cart.component.html',
  styleUrls: ['./mini-cart.component.scss']
})
export class MiniCartComponent {
  NumberUtil = NumberUtil;

  constructor(public cartService: CartService) { }
}
