import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { CouponModel } from 'impactdisciplescommon/src/models/utils/coupon.model';
import { CouponService } from 'impactdisciplescommon/src/services/data/coupon.service';
import { SalesService } from 'impactdisciplescommon/src/services/data/sales.service';
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
    private salesService: SalesService,
    private couponService: CouponService,
    private toastrService: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.shoppingCart = {
      cartItems: this.cartService.getCartProducts(),
    }

    this.settleCart();

    this.resetCartItems();
  }

  async applyCoupon() {
    this.resetCartItems();

    if (this.couponCode) {
      let coupons: CouponModel[] = await this.couponService.getAllByValue('code', this.couponCode);

      if (coupons?.length > 0 && coupons[0]?.isActive) {
        let validCoupon = coupons[0];

        let isValid: boolean = false;

        //set discount on items
        this.shoppingCart.cartItems.forEach(item => {
          if ((validCoupon?.tags?.length > 0 && validCoupon.tags.some(tag => tag.id === item.id)) || (!validCoupon.tags || validCoupon.tags.length == 0)) {
            isValid = true;

            item.discount = parseFloat(((item.price * validCoupon.percentOff) / 100).toFixed(2));

            item.discountPrice = item.price - item.discount;
          }
        });


        if (isValid) {
          this.itemDiscountAmount = validCoupon;

          this.shoppingCart.couponCode = validCoupon.code;

          this.shoppingCart.couponPercent = validCoupon.percentOff;

          this.toastrService.success("Coupon applied successfully.", 'SUCCESS!')
        } else {
          this.toastrService.error("Coupon not valid for these items.", 'ERROR!')
        }

        this.settleCart()
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
    }

    this.settleCart();
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
    this.settleCart();

    this.router.navigate(['/checkout'], { state: { data: this.shoppingCart } });
  }

  private settleCart(){
    let total = 0; // Initialize the total for applicable items
    let totalDiscount = 0; // Initialize the total for applicable items

    this.shoppingCart.cartItems.forEach(item => {
      total += (item.price * item.orderQuantity);

      totalDiscount += (item.discount * item.orderQuantity);
    });

    this.shoppingCart.discount = NumberUtil.isNumber(totalDiscount)? parseFloat(totalDiscount.toFixed(2)) : 0;

    this.shoppingCart.totalBeforeDiscount = NumberUtil.isNumber(total)? total : 0;

    this.shoppingCart.total =  Math.max(this.shoppingCart.totalBeforeDiscount - this.shoppingCart.discount, 0);
  }
}
