// Shape returned by every list page's own getPager(totalItems, currentPage,
// pageSize) helper (dmm/e-books/podcasts/store components - each has its
// own copy of the same pagination-math method, not shared, but they all
// build and consume this identical result shape). Optional throughout since
// every component initializes its `paginate` field to {} before the first
// real getPager() call.
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
