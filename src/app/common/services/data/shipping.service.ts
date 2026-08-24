import { LoggerService } from './logger.service';
import { Injectable } from '@angular/core';
import { CloudFunctionsClient } from 'src/app/common/services/data/cloud-functions.client';
import { UNIT_OF_MEASURE } from '@impact-common/shared/lists/unit_of_measure.enum';
import { ShippingModel, Package, WeightDetail, ShippingRequest, RateOptions } from '@impact-common/shared/models/domain/shipment.model';
import { Address } from '@impact-common/shared/models/domain/utils/address.model';
import { Phone } from '@impact-common/shared/models/domain/utils/phone.model';
import { CheckoutForm } from '@impact-common/shared/models/utils/cart.model';
import { ShippingRate } from '@impact-common/shared/models/domain/shipment-label-batch-request.model';
import { environment } from 'src/environments/environment';
import { WebConfigService } from './web-config.service';


// The ShipEngine rate payload. Was implicitly `any` when it came straight
// off response.json(); the client returns a typed value, so the shape
// calculateShipping() actually reads is named here, over the existing
// shared ShippingRate model rather than a re-invented one.
interface ShippingRateResponse {
  rateResponse: { rates: ShippingRate[] };
}

@Injectable({
  providedIn: 'root'
})

// Not a BaseService. It used to extend one and bind `this.table` to a
// `shipments` collection that has since been deleted - but it never called a
// single CRUD method on it. The only thing this service does is
// calculateShipping(), which goes out through CloudFunctionsClient to
// ShipEngine, so the Firestore inheritance was pure misdirection: it
// advertised a collection that no longer exists and pulled in a FirebaseDAO
// nothing here used.
export class ShippingService {
  shippingCarriers: string[] = environment.shippingCarriers;

  constructor(private webConfigService: WebConfigService, private logService: LoggerService, private client: CloudFunctionsClient) {}

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

  // The ShipEngine rate payload. Was implicitly `any` when this came
  // straight off response.json(); the client returns a typed value, so
  // the shape calculateShipping() actually reads is named here.
  private async makeRequest(request: ShippingRequest): Promise<ShippingRateResponse>{
    try {
      return await this.client.post<ShippingRateResponse>(environment.shippingUrl, request,
        { fallbackError: 'Failed to get Shipping Rates' });
    } catch (err) {
      // The log is the point here - a failed rate lookup is recoverable
      // for the shopper (calculateShipping falls back), but it needs to
      // be visible to staff. Rethrown unchanged afterwards.
      //
      // The old message interpolated JSON.stringify(response) on a
      // Response object, which always serialises to "{}" - so this used
      // to log and throw a literal empty object. The client's error
      // carries the real status and the server's own message instead.
      this.logService.logMessage(
        'SHIPPING REQUEST', request.shipment.shipTo.name,
        'Error receieved from ShippingService: ', String(err));
      throw err;
    }
  }
}
