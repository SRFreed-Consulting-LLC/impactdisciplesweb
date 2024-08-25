import { Injectable } from '@angular/core';
import { CartItem } from './cart.model';

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {
  private cart: CartItem;
  private total: number = 0;

  constructor() {
    // Optionally, initialize from session storage to persist data across page reloads
    const storedCart = sessionStorage.getItem('cart');
    const storedTotal = sessionStorage.getItem('total');
    if (storedCart) {
      this.cart = JSON.parse(storedCart);
    }
    if (storedTotal) {
      this.total = +storedTotal;
    }
  }

  setCartItem(cart) {
    this.cart = cart;
    this.calculateTotal();
    this.saveState();
  }


  getCartItem(): CartItem {
    return this.cart;
  }

  getTotal(): number {
    return this.total;
  }

  clearCart() {
    this.total = 0;
    sessionStorage.removeItem('cart');
    sessionStorage.removeItem('total');
  }

  private calculateTotal() {
    this.total = this.cart.price * this.cart.quantity;
  }

  private saveState() {
    sessionStorage.setItem('cart', JSON.stringify(this.cart));
    sessionStorage.setItem('total', this.total.toString());
  }
}