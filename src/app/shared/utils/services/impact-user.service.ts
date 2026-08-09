import { Injectable } from '@angular/core';
import { BaseService } from 'src/app/common/services/data/base.service';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { CartItem, CheckoutForm } from 'src/app/common/models/utils/cart.model';
import { Timestamp } from 'firebase/firestore';
import { ImpactUser } from '../models/impact-user.model';
import { BookLicenseModel } from '../models/book-license.model';

/**
 * Ported from impactdisciplespwacommon/src/services/impact-user.service.ts
 * (that submodule was removed -- see README "Known technical debt"). Grants
 * a digital-book library license on checkout, same behavior as before, now
 * using this app's own FirebaseDAO/BaseService instead of a second,
 * separate copy of them from the removed submodule. (The original also
 * injected a BookService that was never actually used by either method
 * below -- dropped.)
 */
@Injectable({
  providedIn: 'root'
})
export class ImpactUserService extends BaseService<ImpactUser>{
  constructor(public override dao: FirebaseDAO<ImpactUser>) {
    super(dao)
    this.table = "impact-users"
  }

  async registerImpactUser(checkoutForm: CheckoutForm){
    this.getAllByValue('email', checkoutForm.email).then(users => {
      if(!users || users.length == 0){
        let user: ImpactUser = {...new ImpactUser()}
        user.email = checkoutForm.email?.toLowerCase();
        user.firstName = checkoutForm.firstName;
        user.lastName = checkoutForm.lastName;
        user.phone = checkoutForm.phone;

        this.add(user).then(u => {
          this.getActiveLicenses(u, checkoutForm)
        })
      } else if(users.length == 1){
        this.getActiveLicenses(users[0], checkoutForm)
      }
    })
  }

  async getActiveLicenses(user: ImpactUser, checkoutForm: CheckoutForm){
    let currentLicenses: BookLicenseModel[] = user.bookLicenses? user.bookLicenses : [];

    let licenseRequests: CartItem[] = checkoutForm.cartItems.filter(item => item.isDigitalBook == true);

    // is the user currently licensed for the requested books?
    licenseRequests.forEach(request => {
      let match = currentLicenses?.filter(license => license.bookId == request.digitalBookId)

      if(match && match.length == 1){
        // reset the purchase date to now
        match[0].purchaseDate = Timestamp.now();
      } else {
        // create a new license
        let lm: BookLicenseModel = {...new BookLicenseModel()}
        lm.bookId = request.digitalBookId;
        lm.length = 1
        lm.language = request.language;
        lm.type = 'year';
        lm.purchaseDate = Timestamp.now();

        // add license to user's list
        currentLicenses.push(lm)
      }
    })

    user.bookLicenses = currentLicenses;

    this.update(user.id, user)
  }
}
