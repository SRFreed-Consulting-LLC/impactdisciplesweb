import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PodCastModel } from 'impactdisciplescommon/src/models/domain/pod-cast-model';

@Component({
  selector: 'app-podcast-postbox-item',
  templateUrl: './podcast-postbox-item.component.html',
  styleUrls: ['./podcast-postbox-item.component.scss']
})
export class PodcastPostboxItemComponent {
  @Input() podcast!: PodCastModel;
  @Output() selectPodcast = new EventEmitter<PodCastModel>();

  onSelectPodcast(podcast: PodCastModel) {
    this.selectPodcast.emit(podcast);
  }
}
