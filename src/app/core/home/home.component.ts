import { Component, OnInit } from '@angular/core';
import { EventService } from 'impactdisciplescommon/src/services/data/event.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  isPlaying: boolean = false;

  isSummitPosted: boolean = false;

  constructor(private eventService: EventService) { }

  async ngOnInit(): Promise<void> {
    this.isSummitPosted = await this.eventService.isSummitPosted();
  }

  playVideo(){
    this.isPlaying = true;
  }
}

