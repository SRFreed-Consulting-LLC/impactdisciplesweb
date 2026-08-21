import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ImpactTeamMemberModel } from '@impact-common/shared/models/domain/impact-team-member.model';
import { ImpactTeamService } from 'src/app/common/services/data/impact-team.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-team-details',
    templateUrl: './team-details.component.html',
    styleUrls: ['./team-details.component.scss'],
    standalone: false
})
export class TeamDetailsComponent implements OnInit, OnDestroy {
  teamMember: ImpactTeamMemberModel;

  private ngUnsubscribe = new Subject<void>();

  constructor(private route: ActivatedRoute, private impactTeamService: ImpactTeamService){}

  // Reads `impact_team` now, not `coaches` (2026-08 split) - the same
  // document id was reused by the admin-side move script for anyone who
  // had teamPageSortOrder set, so this route (and the Summit "Featured
  // Speakers" carousel, which links here too) keeps resolving with no
  // route/link changes needed.
  ngOnInit(): void {
    const teamId = this.route.snapshot.paramMap.get('id');
    if (teamId) {
      this.impactTeamService.streamById(teamId).pipe(takeUntil(this.ngUnsubscribe)).subscribe((coach) => {
        if(coach && coach.length == 1){
          this.teamMember = coach[0];
        }
      })
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
