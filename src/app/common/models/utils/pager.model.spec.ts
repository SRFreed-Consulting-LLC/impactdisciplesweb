import { buildPager } from './pager.model';

// The pagination math every list page shares. ProductCatalogService.getPager
// delegates here and its spec pins the same cases through that path; these
// are the direct ones, plus the slice bounds the pages actually use.
describe('buildPager', () => {
  it('shows every page when there are 5 or fewer', () => {
    expect(buildPager(20, 1, 6)).toEqual({
      totalItems: 20, currentPage: 1, pageSize: 6, totalPages: 4,
      startPage: 1, endPage: 4, startIndex: 0, endIndex: 5, pages: [1, 2, 3, 4]
    });
  });

  it('windows three pages around the current page when there are more than 5', () => {
    const pager = buildPager(100, 6);
    expect(pager.pages).toEqual([5, 6, 7]);
    expect(pager.startIndex).toBe(45);
    expect(pager.endIndex).toBe(53);
  });

  it('starts the window at page 1 for the first pages', () => {
    expect(buildPager(100, 1).pages).toEqual([1, 2, 3]);
  });

  it('clamps a current page below 1 or beyond the last page', () => {
    expect(buildPager(20, 0).currentPage).toBe(1);
    expect(buildPager(100, 99).currentPage).toBe(12);
  });

  it('ends the last page at the last item, not past it', () => {
    const last = buildPager(20, 4, 6);
    expect(last.startIndex).toBe(18);
    expect(last.endIndex).toBe(19);
  });

  it('gives an empty list no pages and an end index the slice can take', () => {
    const empty = buildPager(0, 1, 6);
    expect(empty.pages).toEqual([]);
    expect(empty.endIndex).toBe(-1);
  });
});
