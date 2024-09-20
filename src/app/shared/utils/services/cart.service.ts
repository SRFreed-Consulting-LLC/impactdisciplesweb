import { Injectable } from "@angular/core";
import { CartItem } from "../../../../../impactdisciplescommon/src/models/utils/cart.model";
import { ToastrService } from "ngx-toastr";

const state = {
  cart: JSON.parse(localStorage['cart'] || '[]')
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  public orderQuantity: number = 1;

  constructor(private toastrService: ToastrService){}

  public getCartProducts(): CartItem[] {
    return state.cart;
  }

  addCartProduct(payload: CartItem) {
    const isExist = state.cart.some((i: CartItem) => i.id === payload.id);
    // if (payload.status === 'out-of-stock' || payload.quantity === 0) {
    //   this.toastrService.error(`Out of stock ${payload.title}`);
    // }
    // else
    if (!isExist) {
      const newItem = {
        ...payload
      };
      state.cart.push(newItem);
      this.toastrService.success(`${payload.itemName} added to cart`);
    } else {
      state.cart.map((item: CartItem) => {
        if (item.id === payload.id) {
          if (typeof item.orderQuantity !== "undefined") {
            item.orderQuantity =
              this.orderQuantity !== 1
                ? this.orderQuantity + item.orderQuantity
                : item.orderQuantity + 1;
            this.toastrService.success(`${this.orderQuantity} ${item.itemName} added to cart`);
          }
        }
        return { ...item };
      });
    }
    localStorage.setItem("cart", JSON.stringify(state.cart));
  };

  public totalPriceQuantity() {
    return state.cart.reduce(
      (cartTotal: { total: number; quantity: number }, cartItem: CartItem) => {
        const { price, orderQuantity, discount } = cartItem;
        if (typeof orderQuantity !== "undefined") {
          if (discount && discount > 0) {
            const itemTotal = (price - (price * discount) / 100) * orderQuantity;
            cartTotal.total += itemTotal;
          } else {
            const itemTotal = price * orderQuantity;
            cartTotal.total += itemTotal;
          }
          cartTotal.quantity += orderQuantity;
        }
        return cartTotal;
      },
      {
        total: 0,
        quantity: 0,
      }
    );
  };

  increment() {
    return this.orderQuantity = this.orderQuantity + 1;
  }

  decrement() {
    return this.orderQuantity =
      this.orderQuantity > 1
        ? this.orderQuantity - 1
        : this.orderQuantity = 1;
  }

  quantityDecrement(payload: CartItem) {
    state.cart.map((item: CartItem) => {
      if (item.id === payload.id) {
        if (typeof item.orderQuantity !== "undefined") {
          if (item.orderQuantity > 1) {
            item.orderQuantity = item.orderQuantity - 1;
            this.toastrService.info(`Decrement Quantity For ${item.itemName}`);
          }
        }
      }
      return { ...item };
    });
    localStorage.setItem("cart", JSON.stringify(state.cart));
  };

  removeCartProduct(payload: CartItem) {
    state.cart = state.cart.filter(
      (p: CartItem) => p.id !== payload.id
    );
    this.toastrService.error(`${payload.itemName} remove to cart`);
    localStorage.setItem("cart", JSON.stringify(state.cart));
  };

  clearCart() {
    const confirmMsg = window.confirm(
      "Are you sure deleted your all cart items ?"
    );
    if (confirmMsg) {
      state.cart = [];
    }
    localStorage.setItem("cart", JSON.stringify(state.cart));
  };

  clearCartNoConfirmation() {
    state.cart = [];

    localStorage.setItem("cart", JSON.stringify(state.cart));
  };

  initialOrderQuantity() {
    return this.orderQuantity = 1;
  };
}
