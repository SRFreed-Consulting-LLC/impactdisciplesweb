import { Injectable } from "@angular/core";
import { CartItem } from "../../../../../src/app/common/models/utils/cart.model";
import notify from "devextreme/ui/notify";

const state = {
  cart: JSON.parse(localStorage['cart'] || '[]')
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  public orderQuantity: number = 1;

  constructor(){}

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

      notify({
        message: `${payload.itemName} added to cart`,
        position: 'top',
        width: 600,
        type: 'success'
      });

    } else {
      state.cart.map((item: CartItem) => {
        if (item.id === payload.id) {
          if (typeof item.orderQuantity !== "undefined") {
            item.orderQuantity =
              this.orderQuantity !== 1
                ? this.orderQuantity + item.orderQuantity
                : item.orderQuantity + 1;

            notify({
              message: `${this.orderQuantity} ${item.itemName} added to cart`,
              position: 'top',
              width: 600,
              type: 'success'
            });
          }
        }
        return { ...item };
      });
    }
    localStorage.setItem("cart", JSON.stringify(state.cart));
  };

  public totalPriceQuantity() {
    return state.cart.reduce(
      (cartTotal: { total: number; quantity: number; totalBeforeDiscount: number }, cartItem: CartItem) => {
        const { price, orderQuantity, discountPrice } = cartItem;
        if (typeof orderQuantity !== "undefined") {
          const itemTotal = price * orderQuantity;
          cartTotal.totalBeforeDiscount += itemTotal;
          if (discountPrice && discountPrice > 0) {
            const itemTotal = discountPrice * orderQuantity;
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
        totalBeforeDiscount: 0
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

            notify({
              message: `Decrement Quantity For ${item.itemName}`,
              position: 'top',
              width: 600,
              type: 'info'
            });
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

    notify({
      message: `${payload.itemName} remove to cart`,
      position: 'top',
      width: 600,
      type: 'error'
    });

    localStorage.setItem("cart", JSON.stringify(state.cart));
  };

  clearCart() {
    const confirmMsg = window.confirm(
      "Are you sure you want to delete all of your items? ?"
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
