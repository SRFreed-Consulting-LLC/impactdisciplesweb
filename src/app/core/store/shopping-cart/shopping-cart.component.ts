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
  }

  async applyCoupon() {
    this.resetCartItems();

    if (this.couponCode) {
      let coupons: CouponModel[] = await this.couponService.getAllByValue('code', this.couponCode);

      if (coupons?.length > 0 && coupons[0]?.isActive) {
        let validCoupon = coupons[0];
        let discount = 0; // Initialize the total for applicable items

        let isValid: boolean = false;

        this.shoppingCart.cartItems.forEach(item => {

          if (validCoupon?.tags?.length > 0 && validCoupon.tags.some(tag => tag.id === item.id)) {
            isValid = true;

            if (validCoupon.percentOff) {
              item.discountPrice = item.price - ((item.price * validCoupon.percentOff) / 100);
            } else if (validCoupon.dollarsOff) {
              item.discountPrice = Math.max(item.price - validCoupon.dollarsOff, 0);
            }

            discount+=(item.price - item.discountPrice) * item.orderQuantity;
          }
        });

        if(!validCoupon?.tags || validCoupon?.tags?.length == 0){
          isValid = true;

          if (validCoupon.percentOff) {
            discount+=((this.shoppingCart.total * validCoupon.percentOff) / 100);
          } else if (validCoupon.dollarsOff) {
            discount+=validCoupon.dollarsOff;
          }
        }

        if (isValid) {
          this.itemDiscountAmount = validCoupon;

          this.shoppingCart.discount = NumberUtil.isNumber(discount)? discount : 0;

          this.shoppingCart.couponCode = validCoupon.code;

          this.shoppingCart.total =  Math.max(this.shoppingCart.total - this.shoppingCart.discount, 0);

          this.toastrService.success("Coupon applied successfully.", 'SUCCESS!')
        } else {
          this.toastrService.error("Coupon not valid for these items.", 'ERROR!')
        }
      } else {
        this.toastrService.error("Invalid or inactive coupon.", 'ERROR!')
      }
    } else {
      this.toastrService.warning("Please Enter a Coupon Code.", 'ERROR!')

      this.resetCartItems();
    }
  }

  resetCartItems() {
    this.shoppingCart.cartItems.forEach(item => {
      if (item.discountPrice || item.discountPrice === 0) {
        item.discountPrice = null;
      }
    });
    this.shoppingCart.discount = 0;
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
