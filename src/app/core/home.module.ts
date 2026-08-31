import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { SharedModule } from "../shared/shared.module";
import { YouTubePlayerModule } from '@angular/youtube-player';
import { HomeComponent } from "./home/home.component";
import { KitSectionModule } from "./pages/dynamic/kit-section.module";

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  }
];

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    // Home is drawn by the section kit since 2026-08-31, like every page.
    KitSectionModule,
    YouTubePlayerModule,
    RouterModule.forChild(routes)
  ]
})
export class HomeModule { }
