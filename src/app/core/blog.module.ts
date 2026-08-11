import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { YouTubePlayerModule } from '@angular/youtube-player';
import { SharedModule } from "../shared/shared.module";
import { BlogComponent } from "./pages/dmms/dmm.component";
import { BlogPostboxItemComponent } from "./pages/dmms/dmm-postbox-item/dmm-postbox-item.component";
import { PodcastsComponent } from "./pages/podcasts/podcasts.component";
import { PodcastSidebarComponent } from "./pages/podcasts/podcast-sidebar/podcast-sidebar.component";
import { PodcastPostboxItemComponent } from "./pages/podcasts/podcast-postbox-item/podcast-postbox-item.component";

const routes: Routes = [
  {
    path: 'disciple-making-minute',
    component: BlogComponent
  },
  {
    path: 'podcasts',
    component: PodcastsComponent
  }
];

@NgModule({
  declarations: [
    BlogComponent,
    BlogPostboxItemComponent,
    PodcastsComponent,
    PodcastSidebarComponent,
    PodcastPostboxItemComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    YouTubePlayerModule,
    RouterModule.forChild(routes)
  ]
})
export class BlogFeatureModule { }
