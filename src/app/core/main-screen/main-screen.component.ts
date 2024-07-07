import { Component } from '@angular/core';
import { Route, Router } from '@angular/router';
import { DxButtonTypes } from 'devextreme-angular/ui/button';
import { FireAuthDao } from 'impactdisciplescommon/src/dao/fireauth.dao';
import { RouteItem } from 'impactdisciplescommon/src/models/utils/route-item';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { TopNavService } from 'impactdisciplescommon/src/services/utils/top-nav.service';

@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.css']
})
export class MainScreenComponent {

  tabsWithIcon: RouteItem[];

  registrationButtonOptions: DxButtonTypes.Properties = {
    text: 'Registration',
    onClick: () => {
      this.topNavService.navigate({ id: 0, name:'Registrations', route:'registration', icon: 'home', level: 0})
    },
  };

  eventButtonOptions: DxButtonTypes.Properties = {
    text: 'Events',
    onClick: () => {
      this.topNavService.navigate({ id: 0, name:'Events', route:'events', icon: 'home', level: 0})
    },
  };

  coachesButtonOptions: DxButtonTypes.Properties = {
    text: 'Coaches',
    onClick: () => {
      this.topNavService.navigate({ id: 0, name:'Events', route:'coaches', icon: 'home', level: 0})
    },
  };

  coursesButtonOptions: DxButtonTypes.Properties = {
    text: 'Courses',
    onClick: () => {
      this.topNavService.navigate({ id: 0, name:'Events', route:'courses', icon: 'home', level: 0})
    },
  };

  organizationsButtonOptions: DxButtonTypes.Properties = {
    text: 'Organizations',
    onClick: () => {
      this.topNavService.navigate({ id: 0, name:'Events', route:'organizations', icon: 'home', level: 0})
    },
  };

  locationsButtonOptions: DxButtonTypes.Properties = {
    text: 'Locations',
    onClick: () => {
      this.topNavService.navigate({ id: 0, name:'Events', route:'locations', icon: 'home', level: 0})
    },
  };

  usersButtonOptions: DxButtonTypes.Properties = {
    text: 'Users',
    onClick: () => {
      this.topNavService.navigate({ id: 0, name:'Users', route:'users', icon: 'toolbox', level: 0})
    },
  };

  logsButtonOptions: DxButtonTypes.Properties = {
    text: 'Logs',
    onClick: () => {
      this.topNavService.navigate({ id: 0, name:'Logs', route:'log-messages', icon: 'toolbox', level: 0})
    },
  };

  logOffButtonOptions: DxButtonTypes.Properties = {
    text: 'Log Off',
    onClick: () => {
      this.authService.logOut()
    },
  };

  constructor(public topNavService: TopNavService, private authService: AuthService){
    this.tabsWithIcon = [
      { id: 0, name:'Events', route:'home', icon: 'home', level: 0},
      { id: 1, name:'Administration', route:'schedule', icon: 'toolbox', level: 0}
    ];
  }

  tabClicked(e :any){
    this.topNavService.navigate(e.itemData)
  }
}
