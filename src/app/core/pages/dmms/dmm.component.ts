import { ViewportScroller } from '@angular/common';
import { toMillis } from '@impact-common/shared/utils/date-from-timestamp';
import { Component, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { DMMModel } from '@impact-common/shared/models/domain/dmm.model';
import { Pager, buildPager } from 'src/app/common/models/utils/pager.model';
import { DMMService } from 'src/app/common/services/data/dmm.service';

@Component({
    selector: 'app-dmm',
    templateUrl: './dmm.component.html',
    styleUrls: ['./dmm.component.scss'],
    standalone: false
})
export class BlogComponent implements OnInit {
  public dmms: DMMModel[] = [];
  public filteredDmms: DMMModel[] = [];
  public pageSize = 6;
  public paginate: Pager = {};
  public sortBy = 'asc';
  public pageNo = 1;

  // Server-side cap: newest 60 = deepest realistic page 10 at 6/page,
  // instead of streaming the entire growing collection to every visitor.
  private readonly maxDmms = 60;

  constructor(
    private dmmService: DMMService,
    private route: ActivatedRoute,
    private router: Router,
    private viewScroller: ViewportScroller,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    // switchMap cancels the previous streamAllByValue listener before
    // opening a new one on each pagination click, instead of stacking a
    // new live Firestore listener per click.
    this.route.queryParams.pipe(
      switchMap((params) => {
        this.pageNo = params['page'] ? params['page'] : this.pageNo;
        return this.dmmService.streamAllByValueOrdered('isActive', true, 'date', this.maxDmms);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((blogs) => {
      this.dmms = blogs.sort((a, b) => toMillis(b?.date) - toMillis(a?.date));
      this.paginate = buildPager(this.dmms.length, Number(+this.pageNo), this.pageSize);
      this.filteredDmms = this.dmms.slice(this.paginate.startIndex ?? 0, (this.paginate.endIndex ?? -1) + 1);
    });
  }

  setPage(page: number) {
    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { page: page },
        queryParamsHandling: 'merge',
        skipLocationChange: false,
      })
      .finally(() => {
        this.viewScroller.setOffset([120, 120]);
      });
  }
}
