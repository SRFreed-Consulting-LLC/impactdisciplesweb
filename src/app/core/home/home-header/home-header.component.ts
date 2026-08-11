import { Component, HostListener } from '@angular/core';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';

@Component({
    selector: 'app-home-header',
    templateUrl: './home-header.component.html',
    styleUrls: ['./home-header.component.scss'],
    standalone: false
})
export class HomeHeaderComponent {
  public sticky = true;
  public impactDisciplesInfo = impactDisciplesInfo;
  
  @HostListener('window:scroll') onscroll() {
    if (window.scrollY > 80) {
      this.sticky = true;
    } else {
      this.sticky = false;
    }
  }

  constructor(public cartService: CartService, public utilsService: UtilsService,) { }

}
