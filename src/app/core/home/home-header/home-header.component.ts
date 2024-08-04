import { Component, HostListener, Input } from '@angular/core';
import { CartService } from 'src/app/theme/shared/services/cart.service';
import { UtilsService } from 'src/app/theme/shared/services/utils.service';

@Component({
  selector: 'app-home-header',
  templateUrl: './home-header.component.html',
  styleUrls: ['./home-header.component.scss']
})
export class HomeHeaderComponent {
  @Input () header_big = false;
  @Input () white_bg = false;
  @Input () transparent = false;

  public sticky: boolean = false;

  constructor(
    public cartService: CartService,
    public utilsService: UtilsService,
  ) { }

  // sticky nav
  @HostListener('window:scroll', ['$event']) onscroll() {
    if (window.scrollY > 80) {
      this.sticky = true;
    } else {
      this.sticky = false;
    }
  }
}