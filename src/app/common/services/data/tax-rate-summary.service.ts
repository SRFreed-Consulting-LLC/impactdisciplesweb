import { Injectable } from '@angular/core';
import { FirebaseDAO, QueryParam, WhereFilterOperandKeys } from 'src/app/common/dao/firebase.dao';
import { BaseService } from './base.service';
import { TaxRateSummary } from 'src/app/common/models/utils/tax-rate-summary.model';
import { CheckoutForm } from 'src/app/common/models/utils/cart.model';


@Injectable({
  providedIn: 'root'
})
export class TaxRateSummaryService extends BaseService<TaxRateSummary>{
  constructor(public override dao: FirebaseDAO<TaxRateSummary>) {
    super(dao)
    this.table="tax_rate_summaries"
  }

  recordStateTaxesCollected(cart: CheckoutForm){
    if(cart.shippingAddress.zip && cart.taxRate && cart.estimatedTaxes){
      let queries: QueryParam[] = [
        new QueryParam('year', WhereFilterOperandKeys.equal, new Date().getFullYear().toString()),
        new QueryParam('zip', WhereFilterOperandKeys.equal, cart.shippingAddress.zip)
      ]

      this.queryAllByMultiValue(queries).then(items => {
        let item: TaxRateSummary;

        if(items && items.length == 1){
          item = items[0];
          item.total = item.total + cart.estimatedTaxes;
          this.update(item.id, item);
        } else {
          item = {... new TaxRateSummary()};
          item.zip = cart.shippingAddress.zip
          item.total = cart.estimatedTaxes
          item.year = new Date().getFullYear().toString();
          this.add(item);
        }
      })
    }
  }
}


