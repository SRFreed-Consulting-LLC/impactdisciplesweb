import { Component, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ImpactTeamMemberModel } from '@impact-common/shared/models/domain/impact-team-member.model';
import { ImpactTeamService } from 'src/app/common/services/data/impact-team.service';

@Component({
    selector: 'app-team-details',
    templateUrl: './team-details.component.html',
    styleUrls: ['./team-details.component.scss'],
    standalone: false
})
export class TeamDetailsComponent implements OnInit {
  teamMember: ImpactTeamMemberModel;

  constructor(private route: ActivatedRoute, private impactTeamService: ImpactTeamService, private destroyRef: DestroyRef){}

  // Reads `impact_team` now, not `coaches` (2026-08 split) - the same
  // document id was reused by the admin-side move script for anyone who
  // had teamPageSortOrder set, so this route (and the Summit "Featured
  // Speakers" carousel, which links here too) keeps resolving with no
  // route/link changes needed.
  ngOnInit(): void {
    const teamId = this.route.snapshot.paramMap.get('id');
    if (teamId) {
      this.impactTeamService.streamById(teamId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((coach) => {
        if(coach && coach.length == 1){
          this.teamMember = coach[0];
        }
      })
    }
  }

}
