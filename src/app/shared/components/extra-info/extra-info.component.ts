import { Component, OnDestroy } from '@angular/core';
import { AppUser } from 'impactdisciplescommon/src/models/admin/appuser.model';
import { CustomerModel } from 'impactdisciplescommon/src/models/domain/utils/customer.model';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-extra-info',
  templateUrl: './extra-info.component.html',
  styleUrls: ['./extra-info.component.scss']
})
export class ExtraInfoComponent implements OnDestroy {
  isLoggedIn: boolean = false;
  user: AppUser | CustomerModel;

  private ngUnsubscribe = new Subject<void>();

  constructor(public authService: AuthService) {
    this.authService.getUser().pipe(takeUntil(this.ngUnsubscribe)).subscribe((user) => {
      if(user) {
        this.user = user;
        this.isLoggedIn = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
