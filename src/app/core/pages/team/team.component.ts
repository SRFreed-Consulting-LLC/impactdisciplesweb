import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ImpactTeamMemberModel } from 'src/app/common/models/domain/impact-team-member.model';
import { ImpactTeamService } from 'src/app/common/services/data/impact-team.service';
import Swiper from 'swiper';
import { EffectFade, Pagination } from 'swiper/modules';

@Component({
    selector: 'app-team',
    templateUrl: './team.component.html',
    styleUrls: ['./team.component.scss'],
    standalone: false
})
export class TeamComponent implements OnInit, AfterViewInit {
  @ViewChild('heroSliderContainer') heroSliderContainer!: ElementRef;
  public swiperInstance: Swiper | undefined;

  coaches: ImpactTeamMemberModel[];

  constructor(private impactTeamService: ImpactTeamService){}

  // Reads `impact_team` now, not `coaches` (2026-08 split - see
  // impact-team-member.model.ts's own header comment). `teamPageSortOrder`
  // is just `sortOrder` on this collection - there's no second sort
  // concept to disambiguate from since this collection only has the one
  // purpose.
  async ngOnInit(): Promise<void> {
    this.coaches = await this.impactTeamService.getAllByValue('isActive', true).then( coaches => {
      coaches.sort((a, b) => a.sortOrder - b.sortOrder)
      return coaches;
    })

  }

  ngAfterViewInit() {
    if (this.heroSliderContainer) {
      this.swiperInstance = new Swiper('.slider-active', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: false,
        effect: 'fade',
        modules: [Pagination, EffectFade],
        pagination: {
          clickable: true,
          el: '.tp-slider-dot',
        },
      });
    }
  }

}
