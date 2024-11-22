import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { CouponModel } from 'impactdisciplescommon/src/models/utils/coupon.model';
import { CouponService } from 'impactdisciplescommon/src/services/data/coupon.service';
import { NumberUtil } from 'impactdisciplescommon/src/utils/number-util';
import { ToastrService } from 'ngx-toastr';
import { CartService } from 'src/app/shared/utils/services/cart.service';


@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss']
})
export class ShoppingCartComponent implements OnInit {
  shoppingCart: CheckoutForm = {... new CheckoutForm()};
  couponCode: string = '';
  itemDiscountAmount: CouponModel;
  cartDiscountAmount: CouponModel;

  NumberUtil = NumberUtil;

  constructor (
    public cartService: CartService, 
    private couponService: CouponService, 
    private toastrService: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.shoppingCart = {
      cartItems: this.cartService.getCartProducts(),
      total: NumberUtil.isNumber(this.cartService.totalPriceQuantity().total)? this.cartService.totalPriceQuantity().total : 0,
      totalBeforeDiscount: NumberUtil.isNumber(this.cartService.totalPriceQuantity().total)? this.cartService.totalPriceQuantity().total : 0
    }
    this.resetCartItems();
    console.log(this.shoppingCart)
  }

  applyCoupon() {
    this.resetCartItems();

    if (this.couponCode) {
      this.couponService.getAllByValue('code', this.couponCode).then(coupons => {
        if (coupons.length > 0 && coupons[0].isActive) {
          let validCoupon = coupons[0];

          let total = 0; // Initialize the total for applicable items

          let isValid: boolean = false;

          if(validCoupon?.tags?.length > 0) {
            this.shoppingCart.cartItems.forEach(item => {
              let itemTotal = item.price? item.price * item.orderQuantity : 0; // Calculate total for each item

              if ((validCoupon?.tags?.length > 0 && validCoupon.tags.some(tag => tag.id === item.id))) {
                isValid = true;
                this.itemDiscountAmount = validCoupon;
                if (validCoupon.percentOff) {
                  item.discountPrice = item.price - ((item.price * validCoupon.percentOff) / 100);
                } else if (validCoupon.dollarsOff) {
                  item.discountPrice = Math.max(item.price - validCoupon.dollarsOff, 0);
                }
                total+=(item.discountPrice * item.orderQuantity);
              } else {
                total+=itemTotal;
              }
            });
          } else {
            isValid = true;
            this.cartDiscountAmount = validCoupon;
            if (validCoupon.percentOff) {
              total += this.shoppingCart.total - ((this.shoppingCart.total * validCoupon.percentOff) / 100);
            } else if (validCoupon.dollarsOff) {
              let discountAmount = Math.min(validCoupon.dollarsOff, this.shoppingCart.total);
              total += this.shoppingCart.total - discountAmount;
            }
          }


          if (isValid) {
            this.shoppingCart.total = NumberUtil.isNumber(total)? total : 0;

            this.shoppingCart.couponCode = validCoupon.code;

            this.toastrService.success("Coupon applied successfully.", 'SUCCESS!')
          } else {
            this.toastrService.error("Coupon not valid for these items.", 'ERROR!')
          }
        } else {
          this.toastrService.error("Invalid or inactive coupon.", 'ERROR!')
        }
      })
    } else {
      this.resetCartItems();
    }
  }

  resetCartItems() {
    this.shoppingCart.cartItems.forEach(item => {
      if (item.discountPrice || item.discountPrice === 0) {
        item.discountPrice = null;
      }
    });
    this.shoppingCart.total = NumberUtil.isNumber(this.cartService.totalPriceQuantity().total)? this.cartService.totalPriceQuantity().total : 0;
    this.itemDiscountAmount = null;
    this.cartDiscountAmount = null;
  }

  updateShoppingCart() {
    this.shoppingCart = {
      cartItems: this.cartService.getCartProducts(),
      total: NumberUtil.isNumber(this.cartService.totalPriceQuantity().total)? this.cartService.totalPriceQuantity().total : 0,
      totalBeforeDiscount: NumberUtil.isNumber(this.cartService.totalPriceQuantity().total)? this.cartService.totalPriceQuantity().total : 0
    }
  }

  quantityDecrement(item) {
    this.cartService.quantityDecrement(item);
    this.updateShoppingCart()
  }

  addCartProduct(item) {
    this.cartService.addCartProduct(item);
    this.updateShoppingCart()
  }

  removeCartProduct(item) {
    this.cartService.removeCartProduct(item);
    this.updateShoppingCart()
  }

  checkout() {
    this.router.navigate(['/checkout'], { state: { data: this.shoppingCart } });
  }

}
