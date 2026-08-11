import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CheckoutForm } from 'src/app/common/models/utils/cart.model';
import { CouponModel } from 'src/app/common/models/utils/coupon.model';
import { CouponService } from 'src/app/common/services/data/coupon.service';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { ToastService } from 'src/app/shared/utils/services/toast.service';


@Component({
    selector: 'app-shopping-cart',
    templateUrl: './shopping-cart.component.html',
    styleUrls: ['./shopping-cart.component.scss'],
    standalone: false
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
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.shoppingCart = {
      cartItems: this.cartService.getCartProducts(),
    }

    this.settleCart();

    this.resetCartItems();
  }

  getCartSubtotal(){
    return this.shoppingCart.cartItems.map(item => item.price * item.orderQuantity).reduce((a,b) => a + b);
  }

  getCartDiscount(){
    return this.shoppingCart.cartItems.map(item => item.discount ? item.discount * item.orderQuantity : 0).reduce((a,b) => a + b)
  }

  getCartTotal(){
    return this.getCartSubtotal() - this.getCartDiscount();
  }

  async applyCoupon() {
    this.resetCartItems();

    if (this.couponCode) {
      const coupons: CouponModel[] = await this.couponService.getAllByValue('code', this.couponCode);

      if (coupons?.length > 0 && coupons[0]?.isActive) {
        const validCoupon = coupons[0];

        let isValid: boolean = false;

        //set discount on items
        this.shoppingCart.cartItems.forEach(item => {
          if ((validCoupon?.tags?.length > 0 && validCoupon.tags.some(tag => tag.id === item.id)) || (!validCoupon.tags || validCoupon.tags.length == 0)) {
            isValid = true;

            if(!item.salePrice){
              item.discount = parseFloat(((item.price * validCoupon.percentOff) / 100).toFixed(2));

              item.discountPrice = item.price - item.discount;
            }
          }
        });


        if (isValid) {
          this.itemDiscountAmount = validCoupon;

          this.shoppingCart.couponCode = validCoupon.code;

          this.shoppingCart.couponPercent = validCoupon.percentOff;

          this.toastService.notify({ message: 'Coupon applied successfully.', type: 'success' });
        } else {
          this.toastService.notify({ message: 'Coupon not valid for these items.', type: 'error' });
        }

        this.settleCart()
      } else {
        this.toastService.notify({ message: 'Coupon not valid for these items.', type: 'error' });
      }
    } else {
        this.toastService.notify({ message: "Please Enter a Coupon Code.", type: 'success' });

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
    let totalDiscount = 0; // Initialize the total for applicable items

    this.shoppingCart.cartItems.forEach(item => {
      if(item.salePrice){
        item.price = item.salePrice;
      }

      totalDiscount += (item.discount * item.orderQuantity);
    });

    this.shoppingCart.discount = NumberUtil.isNumber(totalDiscount)? parseFloat(totalDiscount.toFixed(2)) : 0;
  }
}
