import { Component } from '@angular/core';
import { CartService } from '../../utils/services/cart.service';
import { NumberUtil } from 'src/app/common/utils/number-util';

@Component({
    selector: 'app-mini-cart',
    templateUrl: './mini-cart.component.html',
    styleUrls: ['./mini-cart.component.scss'],
    standalone: false
})
export class MiniCartComponent {
  NumberUtil = NumberUtil;

  constructor(public cartService: CartService) { }
}
