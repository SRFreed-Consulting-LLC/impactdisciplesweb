import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { DxButtonModule, DxToolbarModule, DxTabsModule } from "devextreme-angular";
import { SharedModule } from "../shared/shared.module";
import { HomeHeaderComponent } from "./home/home-header/home-header.component";
import { HomeComponent } from "./home/home.component";
import { ThemeSharedModule } from "../theme/shared/theme-shared.module";
import { HomeHeaderSliderComponent } from "./home/home-header-slider/home-header-slider.component";
import { HomeServicesComponent } from "./home/home-services/home-services.component";
import { EventsComponent } from "./pages/events/events.component";


@NgModule({
  declarations: [
    HomeComponent,
    HomeHeaderComponent,
    HomeHeaderSliderComponent,
    HomeServicesComponent,
    EventsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    ThemeSharedModule
  ],
  exports: [
    HomeComponent,
    HomeHeaderComponent,
    HomeHeaderSliderComponent,
    HomeServicesComponent
  ]
})
export class CoreModule { }
