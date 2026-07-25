import { Component } from '@angular/core';
import { UtilsService } from '../../../services/utils.service';

@Component({
    selector: 'theme-product-modal',
    templateUrl: './product-modal.component.html',
    styleUrls: ['./product-modal.component.scss'],
    standalone: false
})
export class ProductModalComponent {

  constructor(public utilsService:UtilsService){}

}
