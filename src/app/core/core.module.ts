import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainScreenComponent } from './main-screen/main-screen.component';
import { DxButtonModule, DxTabsModule, DxToolbarModule } from 'devextreme-angular';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SharedModule } from '../shared/shared.module';
import { ServicesComponent } from './services/services.component';
import { HomeHeaderComponent } from './home/home-header/home-header.component';

@NgModule({
  declarations: [
    MainScreenComponent,
    HomeComponent,
    ServicesComponent,
    HomeHeaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    DxButtonModule,
    DxToolbarModule,
    DxTabsModule
  ],
  exports: [
    ServicesComponent,
    HomeHeaderComponent
  ]
})
export class CoreModule { }
