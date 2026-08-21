import { ProductModel } from '@impact-common/shared/models/utils/product.model';
import { UNIT_OF_MEASURE } from '@impact-common/shared/lists/unit_of_measure.enum';
import { SaleModel } from '@impact-common/shared/models/utils/sale.model';
import { SalesService } from 'src/app/common/services/data/sales.service';
import { ProductCatalogService } from './product-catalog.service';

// ProductCatalogService is the shared home for the browse/filter/pager logic
// the store and e-books pages used to duplicate verbatim, so a change here
// silently changes both pages. Its only dependency is SalesService, and only
// getAllByValue() is ever called - a duck-typed stub stands in for the whole
// DAO/AngularFire graph (house convention, see permission.service.spec.ts in
// the admin repo).
//
// The pager assertions PIN the existing math rather than an idealized one:
// two quirks are deliberately captured below (endPage overshooting the last
// page, and the negative indices an empty list produces) so a future rewrite
// has to notice it is changing them.

function salesServiceReturning(sales: SaleModel[]): { service: SalesService; calls: () => number } {
  let calls = 0;
  const service = {
    getAllByValue: (field: string, value: unknown) => {
      calls += 1;
      expect(field).toBe('isActive');
      expect(value).toBeTrue();
      return Promise.resolve(sales);
    }
  } as unknown as SalesService;
  return { service, calls: () => calls };
}

function sale(overrides: Partial<SaleModel> = {}): SaleModel {
  const day = 24 * 60 * 60 * 1000;
  return {
    name: 'sale',
    startDate: new Date(Date.now() - day).toISOString(),
    endDate: new Date(Date.now() + day).toISOString(),
    isActive: true,
    percentOff: 10,
    isProducts: true,
    isEvents: false,
    isShipping: false,
    ...overrides
  } as SaleModel;
}

function product(overrides: Partial<ProductModel> = {}): ProductModel {
  return { id: 'p1', title: 'Product', cost: 20, ...overrides } as ProductModel;
}

describe('ProductCatalogService', () => {
  describe('getActiveSales', () => {
    it('keeps only sales whose window contains today', async () => {
      const day = 24 * 60 * 60 * 1000;
      const past = sale({
        name: 'past',
        startDate: new Date(Date.now() - 10 * day).toISOString(),
        endDate: new Date(Date.now() - 5 * day).toISOString()
      });
      const future = sale({
        name: 'future',
        startDate: new Date(Date.now() + 5 * day).toISOString(),
        endDate: new Date(Date.now() + 10 * day).toISOString()
      });
      const live = sale({ name: 'live' });

      const { service } = salesServiceReturning([past, future, live]);
      const sales = await new ProductCatalogService(service).getActiveSales();

      expect(sales.map(s => s.name)).toEqual(['live']);
    });

    it('queries the sales collection once and caches the result', async () => {
      const { service, calls } = salesServiceReturning([sale()]);
      const catalog = new ProductCatalogService(service);

      await catalog.getActiveSales();
      await catalog.getActiveSales();
      await catalog.getActiveSales();

      expect(calls()).toBe(1);
    });
  });

  describe('applyActiveProductSale', () => {
    let catalog: ProductCatalogService;

    beforeEach(() => {
      catalog = new ProductCatalogService(salesServiceReturning([]).service);
    });

    it('sets salePrice from the first isProducts sale, in place', () => {
      const products = [product({ cost: 20 }), product({ cost: 15 })];
      catalog.applyActiveProductSale(products, [sale({ percentOff: 25 })]);

      expect(products[0].salePrice).toBe(15);
      expect(products[1].salePrice).toBe(11.25);
    });

    it('ignores sales that are not product sales', () => {
      const products = [product({ cost: 20 })];
      catalog.applyActiveProductSale(products, [
        sale({ isProducts: false, isShipping: true, percentOff: 50 })
      ]);

      expect(products[0].salePrice).toBeUndefined();
    });

    it('uses the FIRST product sale when several are live', () => {
      const products = [product({ cost: 20 })];
      catalog.applyActiveProductSale(products, [
        sale({ name: 'first', percentOff: 10 }),
        sale({ name: 'second', percentOff: 50 })
      ]);

      expect(products[0].salePrice).toBe(18);
    });

    it('clamps an out-of-range or non-numeric percentOff instead of trusting it', () => {
      // Defence in depth for records written before the admin dialog
      // validated 0-100 (see NumberUtil.clampPercent).
      const over = [product({ cost: 20 })];
      catalog.applyActiveProductSale(over, [sale({ percentOff: 150 })]);
      expect(over[0].salePrice).toBe(0); // clamped to 100% off, never negative

      const under = [product({ cost: 20 })];
      catalog.applyActiveProductSale(under, [sale({ percentOff: -50 })]);
      expect(under[0].salePrice).toBe(20); // clamped to 0% off

      const bad = [product({ cost: 20 })];
      catalog.applyActiveProductSale(bad, [sale({ percentOff: null })]);
      expect(bad[0].salePrice).toBe(20);
    });

    it('does nothing when there are no active sales', () => {
      const products = [product({ cost: 20 })];
      catalog.applyActiveProductSale(products, []);
      expect(products[0].salePrice).toBeUndefined();
    });
  });

  describe('productToCartItem', () => {
    let catalog: ProductCatalogService;

    beforeEach(() => {
      catalog = new ProductCatalogService(salesServiceReturning([]).service);
    });

    it('maps a product to a single-quantity cart item', () => {
      const item = catalog.productToCartItem(
        product({ id: 'abc', title: 'A Book', cost: 12.5, salePrice: 9.99, weight: 2, uom: UNIT_OF_MEASURE.POUND })
      );

      expect(item.id).toBe('abc');
      expect(item.itemName).toBe('A Book');
      expect(item.orderQuantity).toBe(1);
      expect(item.price).toBe(12.5);
      expect(item.salePrice).toBe(9.99);
      expect(item.weight).toBe(2);
      expect(item.uom).toBe(UNIT_OF_MEASURE.POUND);
      expect(item.isEvent).toBeFalse();
    });

    it('guards non-numeric prices to 0 rather than NaN', () => {
      const item = catalog.productToCartItem(
        product({ cost: undefined, salePrice: 'free' as unknown as number })
      );
      expect(item.price).toBe(0);
      expect(item.salePrice).toBe(0);
    });

    it('coerces the book flags and defaults their ids', () => {
      const ebook = catalog.productToCartItem(product({ isEBook: true }));
      expect(ebook.isEBook).toBeTrue();
      expect(ebook.isDigitalBook).toBeFalse();
      expect(ebook.digitalBookId).toBe('');
      expect(ebook.eBookUrl).toBeNull();

      const digital = catalog.productToCartItem(
        product({ isDigitalBook: true, digitalBookId: 'book-1' })
      );
      expect(digital.isDigitalBook).toBeTrue();
      expect(digital.digitalBookId).toBe('book-1');
    });

    it('carries a follow-up email id only when the product opts in', () => {
      expect(catalog.productToCartItem(
        product({ sendFollowUpEmail: true, followUpEmailId: 'tpl-1' })
      ).followUpEmailId).toBe('tpl-1');

      expect(catalog.productToCartItem(
        product({ sendFollowUpEmail: false, followUpEmailId: 'tpl-1' })
      ).followUpEmailId).toBe('');

      expect(catalog.productToCartItem(
        product({ sendFollowUpEmail: true })
      ).followUpEmailId).toBe('');
    });

    it('passes size/color/language options through', () => {
      const item = catalog.productToCartItem(product(), {
        size: 'L', color: 'blue', language: 'es'
      });
      expect([item.size, item.color, item.language]).toEqual(['L', 'blue', 'es']);
    });
  });

  describe('sorting and filtering', () => {
    let catalog: ProductCatalogService;

    beforeEach(() => {
      catalog = new ProductCatalogService(salesServiceReturning([]).service);
    });

    it('sorts by title, price ascending and price descending without mutating the input', () => {
      const products = [
        product({ id: 'b', title: 'Banana', cost: 30 }),
        product({ id: 'a', title: 'Apple', cost: 10 }),
        product({ id: 'c', title: 'Cherry', cost: 20 })
      ];
      const original = products.map(p => p.id);

      expect(catalog.sortByAZ(products).map(p => p.id)).toEqual(['a', 'b', 'c']);
      expect(catalog.sortByPriceAsc(products).map(p => p.id)).toEqual(['a', 'c', 'b']);
      expect(catalog.sortByPriceDesc(products).map(p => p.id)).toEqual(['b', 'c', 'a']);
      expect(products.map(p => p.id)).toEqual(original);
    });

    it('treats a missing cost as 0 in both price directions', () => {
      const products = [
        product({ id: 'priced', cost: 5 }),
        product({ id: 'nocost', cost: undefined })
      ];
      expect(catalog.sortByPriceAsc(products).map(p => p.id)).toEqual(['nocost', 'priced']);
      expect(catalog.sortByPriceDesc(products).map(p => p.id)).toEqual(['priced', 'nocost']);
    });

    it('filters by category and orders by categoryOrder', () => {
      const products = [
        product({ id: 'x', category: 'cat-1', categoryOrder: 2 }),
        product({ id: 'y', category: 'cat-2', categoryOrder: 1 }),
        product({ id: 'z', category: 'cat-1', categoryOrder: 1 }),
        product({ id: 'w', category: 'cat-1' })
      ];
      expect(catalog.filterByCategory(products, 'cat-1').map(p => p.id))
        .toEqual(['w', 'z', 'x']); // missing order sorts as 0
    });

    it('filters by series and orders by seriesOrder', () => {
      const products = [
        product({ id: 'x', series: 's-1', seriesOrder: 3 }),
        product({ id: 'y', series: 's-2', seriesOrder: 1 }),
        product({ id: 'z', series: 's-1', seriesOrder: 1 })
      ];
      expect(catalog.filterBySeries(products, 's-1').map(p => p.id)).toEqual(['z', 'x']);
    });
  });

  describe('getPager', () => {
    let catalog: ProductCatalogService;

    beforeEach(() => {
      catalog = new ProductCatalogService(salesServiceReturning([]).service);
    });

    it('shows every page when there are 5 or fewer', () => {
      expect(catalog.getPager(20)).toEqual({
        totalItems: 20, currentPage: 1, pageSize: 9, totalPages: 3,
        startPage: 1, endPage: 3, startIndex: 0, endIndex: 8, pages: [1, 2, 3]
      });
    });

    it('windows the page list around the current page when there are more than 5', () => {
      expect(catalog.getPager(100, 6)).toEqual({
        totalItems: 100, currentPage: 6, pageSize: 9, totalPages: 12,
        startPage: 5, endPage: 7, startIndex: 45, endIndex: 53, pages: [5, 6, 7]
      });
    });

    it('starts the window at page 1 for the first pages', () => {
      const pager = catalog.getPager(100, 1);
      expect(pager.pages).toEqual([1, 2, 3]);
      expect(pager.startIndex).toBe(0);
      expect(pager.endIndex).toBe(8);
    });

    it('clamps a current page below 1 or beyond the last page', () => {
      expect(catalog.getPager(20, 0).currentPage).toBe(1);

      const past = catalog.getPager(100, 99);
      expect(past.currentPage).toBe(12);
      expect(past.startIndex).toBe(99);
      expect(past.endIndex).toBe(99); // clipped to the last item, not 107
      // PINS a known quirk: the window still runs one page past the end.
      expect(past.pages).toEqual([11, 12, 13]);
    });

    it('honours a custom page size', () => {
      const pager = catalog.getPager(10, 2, 4);
      expect(pager.totalPages).toBe(3);
      expect(pager.startIndex).toBe(4);
      expect(pager.endIndex).toBe(7);
    });

    it('produces an empty page list for an empty catalog', () => {
      // PINS current behaviour: no pages, and the indices go negative
      // because there is nothing to slice - callers guard on pages.length.
      const pager = catalog.getPager(0);
      expect(pager.totalPages).toBe(0);
      expect(pager.pages).toEqual([]);
      expect(pager.startIndex).toBe(-9);
      expect(pager.endIndex).toBe(-1);
    });
  });
});
