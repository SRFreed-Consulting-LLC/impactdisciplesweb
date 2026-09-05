// The pagination shape the list pages (dmm / e-books / podcasts / store)
// build with buildPager() below and hand to <app-pagination>. Optional
// throughout since every component initializes its `paginate` field to {}
// before the first real buildPager() call.
export interface Pager {
  totalItems?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  startPage?: number;
  endPage?: number;
  startIndex?: number;
  endIndex?: number;
  pages?: number[];
}

/**
 * The one pagination calculation. Until 2026-09-05 dmm.component.ts and
 * podcasts.component.ts each carried a private, byte-identical copy of this
 * (a third had already moved to ProductCatalogService.getPager, which now
 * delegates here), so a change to the window width would have had to be made
 * in three places and would have been made in one.
 *
 * Shows every page when there are five or fewer; otherwise a three-page
 * window around the current page. currentPage is clamped into range.
 */
export function buildPager(totalItems: number, currentPage = 1, pageSize = 9): Pager {
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginateRange = 3;

  if (currentPage < 1) {
    currentPage = 1;
  } else if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  let startPage: number;
  let endPage: number;
  if (totalPages <= 5) {
    startPage = 1;
    endPage = totalPages;
  } else if (currentPage < paginateRange - 1) {
    startPage = 1;
    endPage = startPage + paginateRange - 1;
  } else {
    startPage = currentPage - 1;
    endPage = currentPage + 1;
  }

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);
  const pages = Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);

  return { totalItems, currentPage, pageSize, totalPages, startPage, endPage, startIndex, endIndex, pages };
}
