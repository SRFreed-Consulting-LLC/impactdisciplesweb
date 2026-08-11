import { Component, OnInit } from '@angular/core';
import { EventService } from 'src/app/common/services/data/event.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent implements OnInit {

  isPlaying = false;

  isSummitPosted = false;

  constructor(private eventService: EventService) { }

  async ngOnInit(): Promise<void> {
    this.isSummitPosted = await this.eventService.isSummitPosted();
  }

  playVideo(){
    this.isPlaying = true;
  }
}

