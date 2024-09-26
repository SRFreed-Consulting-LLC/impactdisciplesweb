import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CoachModel } from 'impactdisciplescommon/src/models/domain/coach.model';
import { CoachService } from 'impactdisciplescommon/src/services/coach.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-team-details',
  templateUrl: './team-details.component.html',
  styleUrls: ['./team-details.component.scss']
})
export class TeamDetailsComponent implements OnInit, OnDestroy {
  teamMember: CoachModel;

  private ngUnsubscribe = new Subject<void>();

  constructor(private route: ActivatedRoute, private coachService: CoachService){}

  ngOnInit(): void {
    const teamId = this.route.snapshot.paramMap.get('id');
    if (teamId) {
      this.coachService.streamById(teamId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((coach) => {
        this.teamMember = coach;
      })
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
