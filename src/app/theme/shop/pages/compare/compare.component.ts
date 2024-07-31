import { Component } from '@angular/core';
import { CartService } from 'src/app/theme/shared/services/cart.service';
import { CompareService } from 'src/app/theme/shared/services/compare.service';

@Component({
  selector: 'app-compare',
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.scss']
})
export class CompareComponent {

  constructor(
    public compareService: CompareService,
    public cartService: CartService
  ) {}

}
