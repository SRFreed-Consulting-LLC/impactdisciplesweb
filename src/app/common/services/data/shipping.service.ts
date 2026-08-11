import { LoggerService } from './logger.service';
import { Injectable } from '@angular/core';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { UNIT_OF_MEASURE } from 'src/app/common/lists/unit_of_measure.enum';
import { ShippingModel, Package, WeightDetail, ShippingRequest, RateOptions } from 'src/app/common/models/domain/shipment.model';
import { Address } from 'src/app/common/models/domain/utils/address.model';
import { Phone } from 'src/app/common/models/domain/utils/phone.model';
import { CheckoutForm } from 'src/app/common/models/utils/cart.model';
import { environment } from 'src/environments/environment';
import { BaseService } from './base.service';
import { WebConfigService } from './web-config.service';


@Injectable({
  providedIn: 'root'
})
export class ShippingService extends BaseService<ShippingModel>{
  shippingCarriers: string[] = environment.shippingCarriers;


  constructor(public override dao: FirebaseDAO<ShippingModel>, private webConfigService: WebConfigService, private logService: LoggerService) {
    super(dao)
    this.table="shipments"
  }

  async calculateShipping(checkoutForm: CheckoutForm): Promise<CheckoutForm>{
    let totalWeight: number;

    try {
      const weightMap =  checkoutForm.cartItems.filter(item => item.isEvent == false).map(item => (item.weight? item.weight : 0) * item.orderQuantity);

      totalWeight = (weightMap && weightMap.length > 0)? weightMap.reduce((a,b) => a + b) : 0;
    } catch(err){
      this.logService.logMessage('SHIPPING REQUEST', checkoutForm.email, 'Error receieved calculating shipping: ', JSON.stringify(err));

      totalWeight = 0;
    }

    const request: ShippingRequest = await this.createRequest(checkoutForm, totalWeight);

    if(totalWeight > 0){
      return this.makeRequest(request).then(result => {
        if (result) {
          result.rateResponse.rates.sort((a, b) => a.shippingAmount.amount - b.shippingAmount.amount);

          checkoutForm.shippingRateId = {... result.rateResponse.rates[0]};

          checkoutForm.shippingRate = Number(Number(result.rateResponse.rates[0].shippingAmount.amount).toFixed(2));
        }

        return checkoutForm;
      })
    } else {
      checkoutForm.shippingRate = 0;

      return Promise.resolve(checkoutForm)
    }
  }

  private async createRequest(checkoutForm: CheckoutForm, weight: number): Promise<ShippingRequest>{
    const request: ShippingRequest = {... new ShippingRequest()};

    try {
      const configs = await this.webConfigService.getAll();

      const toName: string = checkoutForm.firstName + ' ' + checkoutForm.lastName;
      const toAddress: Address = checkoutForm.shippingAddress;
      const toPhone: Phone = checkoutForm.phone;

      const shipping: ShippingModel = {...new ShippingModel()};
      shipping.shipTo.name = toName;
      shipping.shipTo.phone = toPhone.number;
      shipping.shipTo.addressLine1 = toAddress.address1;
      shipping.shipTo.cityLocality = toAddress.city;
      shipping.shipTo.stateProvince = toAddress.state;
      shipping.shipTo.postalCode = toAddress.zip;
      shipping.shipTo.countryCode = toAddress.country;

      shipping.shipFrom.name = "Impact Disciples";
      shipping.shipFrom.phone = configs[0].phone;
      shipping.shipFrom.addressLine1 = configs[0].address.address1;
      shipping.shipFrom.cityLocality = configs[0].address.city;
      shipping.shipFrom.stateProvince = configs[0].address.state;
      shipping.shipFrom.postalCode = configs[0].address.zip;
      shipping.shipFrom.countryCode = "US";

      const pkg: Package = {... new Package()};
      pkg.weight = {...new WeightDetail()};
      pkg.weight.unit = UNIT_OF_MEASURE.OUNCE;
      pkg.weight.value = weight? weight : 0;

      shipping.packages.push(pkg);

      request.rateOptions = {... new RateOptions()};
      request.rateOptions.carrierIds = this.shippingCarriers;
      request.shipment = shipping;

      return request;
    } catch (err) {
      this.logService.logMessage('SHIPPING REQUEST', checkoutForm.email, 'Error receieved creating shipping request: ', JSON.stringify(err));
      return request;
    }
  }

  private async makeRequest(request: ShippingRequest){
    const response = await fetch(environment.shippingUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      this.logService.logMessage('SHIPPING REQUEST', request.shipment.shipTo.name, 'Error receieved from ShippingService: ', JSON.stringify(response));

      throw new Error('Failed to get Shipping Rates: ' + JSON.stringify(response));
    }

    const rate = await response.json();

    return rate;
  }
}
