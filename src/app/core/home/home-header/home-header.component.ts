import { Component, HostListener, Input } from '@angular/core';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';
import { CartService } from 'src/app/shared/utils/services/cart.service';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-home-header',
  templateUrl: './home-header.component.html',
  styleUrls: ['./home-header.component.scss']
})
export class HomeHeaderComponent {
  public sticky: boolean = false;
  public impactDisciplesInfo = impactDisciplesInfo;

  constructor(public cartService: CartService, public utilsService: UtilsService,) { }

  // sticky nav
  @HostListener('window:scroll', ['$event']) onscroll() {
    if (window.scrollY > 80) {
      this.sticky = true;
    } else {
      this.sticky = false;
    }
  }
}