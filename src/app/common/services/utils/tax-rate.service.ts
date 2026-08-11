import { Injectable, OnInit } from '@angular/core';
import { CheckoutForm } from 'src/app/common/models/utils/cart.model';
import { LoggerService } from '../data/logger.service';
import { WebConfigService } from '../data/web-config.service';
import { WebConfigModel } from 'src/app/common/models/utils/web-config.model';


@Injectable({
  providedIn: 'root'
})
export class TaxRateService implements OnInit {

  webconfig: WebConfigModel;

  constructor(private logService: LoggerService, private webconfigService: WebConfigService) {
    this.webconfigService.getAll().then(configs => {
      this.webconfig = configs[0];
    })
  }

  async ngOnInit(): Promise<void> {
    this.webconfig = await this.webconfigService.getAll()[0];
  }

  async calculateTaxRate(checkoutForm: CheckoutForm): Promise<CheckoutForm>{
    var myHeaders = new Headers();
    myHeaders.append("apikey", this.webconfig.taxApiKey);

    const taxRates = await fetch("https://api.apilayer.com/tax_data/tax_rates?zip="+checkoutForm.shippingAddress.zip+"&use_client_ip=false&country=US", {
      method: 'GET',
      redirect: 'follow',
      headers: myHeaders
    })
    .then(response => response.json())
    .catch(error => {
        this.logService.logMessage('TAXCALC REQUEST', checkoutForm.email, 'Error receieved from Tax Calc Service: ', JSON.stringify(error));
    });

    if (!taxRates) {
      this.logService.logMessage('TAXCALC REQUEST', checkoutForm.email, 'No Tax Rate returned: Setting to .07');

      checkoutForm.taxRate = .07;
      checkoutForm.taxSource = "default";
    } else {
      //if no response received. defaultto .07
      checkoutForm.taxRate = taxRates?.combined_rate ? taxRates.combined_rate : .07;
      checkoutForm.taxSource = "service";
    }

    let taxableAmount : number;

    try{
      taxableAmount = checkoutForm.cartItems.filter(item => item.isEvent == false).map(item => (item.price? item.price : 0) * item.orderQuantity)?.reduce((a,b) => a + b);
    } catch {
      this.logService.logMessage('TAXCALC REQUEST', checkoutForm.email, 'Error getting taxable amount');

      taxableAmount = 0;
    }

    checkoutForm.estimatedTaxes = Number((taxableAmount * checkoutForm.taxRate).toFixed(2));

    checkoutForm.total += Number(checkoutForm.estimatedTaxes.toFixed(2));

    return checkoutForm;
  }
}


