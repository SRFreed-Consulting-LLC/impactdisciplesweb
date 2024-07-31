import { Component } from '@angular/core';
import { CartService } from 'src/app/theme/shared/services/cart.service';
import { WishlistService } from 'src/app/theme/shared/services/wishlist.service';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
})
export class WishlistComponent {
  constructor(
    public wishlistService: WishlistService,
    public cartService: CartService
  ) {}
}
