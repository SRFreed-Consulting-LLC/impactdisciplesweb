import { Component } from '@angular/core';
import { DxButtonTypes } from 'devextreme-angular/ui/button';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { TopNavService } from 'impactdisciplescommon/src/services/utils/top-nav.service';

@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.css']
})
export class MainScreenComponent {

  registrationButtonOptions: DxButtonTypes.Properties = {
    text: 'Registration',
    onClick: () => {
      this.topNavService.navigate({ id: 0, name:'Registrations', route:'registration', icon: 'home', level: 0})
    },
  };

  logOffButtonOptions: DxButtonTypes.Properties = {
    text: 'Log Off',
    onClick: () => {
      this.authService.logOut()
    },
  };

  constructor(public topNavService: TopNavService, private authService: AuthService){}

  tabClicked(e :any){
    this.topNavService.navigate(e.itemData)
  }
}
