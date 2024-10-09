import { query } from '@angular/fire/firestore';
import { EventService } from './../../../../../impactdisciplescommon/src/services/event.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QueryParam, WhereFilterOperandKeys } from 'impactdisciplescommon/src/dao/firebase.dao';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';

@Component({
  selector: 'app-summit',
  templateUrl: './summit.component.html',
  styleUrls: ['./summit.component.css']
})
export class SummitComponent implements OnInit {

  summit: EventModel;

  constructor(private route: ActivatedRoute, private eventService: EventService) { }

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      let year = Number(params.get('year'));
      let query = [
        new QueryParam('startDate', WhereFilterOperandKeys.more, new Date('1/1/' +(year))),
        new QueryParam('isSummit', WhereFilterOperandKeys.equal, true)
      ]

      this.summit = await this.eventService.queryAllByValues(query).then(events => {
        if(events && events.length == 1){
          return events[0]
        } else {
          console.error('No summit event found for ' + year);

          return null;
        }

      });
    });
  }

}
