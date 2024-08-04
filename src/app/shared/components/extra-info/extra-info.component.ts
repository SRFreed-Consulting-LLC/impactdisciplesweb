import { Component } from '@angular/core';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';

@Component({
  selector: 'app-extra-info',
  templateUrl: './extra-info.component.html',
  styleUrls: ['./extra-info.component.scss']
})
export class ExtraInfoComponent {

  constructor(public authService: AuthService) {}

}
