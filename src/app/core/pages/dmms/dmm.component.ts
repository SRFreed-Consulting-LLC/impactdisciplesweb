import { ViewportScroller } from '@angular/common';
import { toMillis } from '@impact-common/shared/utils/date-from-timestamp';
import { Component, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { DMMModel } from '@impact-common/shared/models/domain/dmm.model';
import { Pager } from 'src/app/common/models/utils/pager.model';
import { DMMService } from 'src/app/common/services/data/dmm.service';
import impactDisciplesInfo from 'src/app/shared/utils/data/impact-disciples.data';

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
  public impactDisciplesInfo = impactDisciplesInfo;

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
      this.paginate = this.getPager(this.dmms.length, Number(+this.pageNo), this.pageSize);
      this.filteredDmms = this.dmms.slice(this.paginate.startIndex, this.paginate.endIndex + 1);
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

  getPager(totalItems: number, currentPage = 1, pageSize = 9) {
    // calculate total pages
    const totalPages = Math.ceil(totalItems / pageSize);

    // Paginate Range
    const paginateRange = 3;

    // ensure current page isn't out of range
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    let startPage: number, endPage: number;
    if (totalPages <= 5) {
      startPage = 1;
      endPage = totalPages;
    } else if(currentPage < paginateRange - 1){
      startPage = 1;
      endPage = startPage + paginateRange - 1;
    } else {
      startPage = currentPage - 1;
      endPage =  currentPage + 1;
    }

    // calculate start and end item indexes
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

    // create an array of pages to ng-repeat in the pager control
    const pages = Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);

    // return object with all pager properties required by the view
    return {
      totalItems: totalItems,
      currentPage: currentPage,
      pageSize: pageSize,
      totalPages: totalPages,
      startPage: startPage,
      endPage: endPage,
      startIndex: startIndex,
      endIndex: endIndex,
      pages: pages
    };
  }
}
