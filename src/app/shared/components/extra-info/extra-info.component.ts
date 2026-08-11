import { Component, OnDestroy } from '@angular/core';
import { CustomerModel } from 'src/app/common/models/domain/utils/customer.model';
import { Subject, } from 'rxjs';

@Component({
    selector: 'app-extra-info',
    templateUrl: './extra-info.component.html',
    styleUrls: ['./extra-info.component.scss'],
    standalone: false
})
export class ExtraInfoComponent implements OnDestroy {
  isLoggedIn = false;
  user: CustomerModel;

  private ngUnsubscribe = new Subject<void>();

  constructor() {

  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
