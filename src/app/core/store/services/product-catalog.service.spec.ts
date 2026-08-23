import { ProductModel } from '@impact-common/shared/models/utils/product.model';
import { UNIT_OF_MEASURE } from '@impact-common/shared/lists/unit_of_measure.enum';
import { CampaignOfferModel } from '@impact-common/shared/models/utils/campaign-offer.model';
import { CampaignOfferService } from 'src/app/common/services/data/campaign-offer.service';
import { AttributionService } from 'src/app/shared/utils/services/attribution.service';
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

function product(overrides: Partial<ProductModel> = {}): ProductModel {
  return { id: 'p1', title: 'Product', cost: 20, ...overrides } as ProductModel;
}

function offer(overrides: Partial<CampaignOfferModel> = {}): CampaignOfferModel {
  return {
    campaignId: 'camp-1',
    target: { kind: 'product', id: 'p1' },
    discount: { type: 'percentOff', value: 10 },
    freeShipping: false,
    isActive: true,
    startsAt: null,
    endsAt: null,
    requiresAttribution: false,
    ...overrides
  } as CampaignOfferModel;
}

/** Offers are read through CampaignOfferService, which does its own caching. */
function offerServiceReturning(offers: CampaignOfferModel[]): CampaignOfferService {
  return {
    getActiveOffers: () => Promise.resolve(offers)
  } as unknown as CampaignOfferService;
}

/** Attribution only matters to offers that require it (the early-bird rule). */
function attributionOf(campaignId: string | null): AttributionService {
  return {
    get: () => (campaignId ? { campaignId } : null)
  } as unknown as AttributionService;
}

function makeCatalog(
  offers: CampaignOfferModel[] = [],
  attributedCampaignId: string | null = null
): ProductCatalogService {
  return new ProductCatalogService(
    offerServiceReturning(offers),
    attributionOf(attributedCampaignId)
  );
}

describe('ProductCatalogService', () => {
  describe('applyActiveOffers', () => {
    // Replaces applyActiveProductSale. The behaviour differences are the point:
    // the old version rewrote EVERY product from the first active sale, so a
    // product nobody targeted was still discounted and a second live sale was
    // silently ignored. Pricing itself is pinned in the shared
    // campaign-offer.model spec - what is pinned HERE is which products get
    // touched at all.

    it('prices a product its offer targets, in place', () => {
      const catalog = makeCatalog();
      const products = [product({ cost: 20 })];

      catalog.applyActiveOffers(products, [offer({ discount: { type: 'percentOff', value: 25 } })]);

      expect(products[0].salePrice).toBe(15);
    });

    it('leaves an untargeted product alone instead of discounting it', () => {
      // The v2 bug: a global sale set salePrice on every product in the list.
      const catalog = makeCatalog();
      const products = [product({ id: 'p1', cost: 20 }), product({ id: 'p2', cost: 30 })];

      catalog.applyActiveOffers(products, [offer({ target: { kind: 'product', id: 'p1' } })]);

      expect(products[0].salePrice).toBe(18);
      expect(products[1].salePrice).toBeUndefined();
    });

    it('prices every product in a targeted series', () => {
      const catalog = makeCatalog();
      const products = [
        product({ id: 'p1', cost: 20, series: 'ser-1' }),
        product({ id: 'p2', cost: 40, series: 'ser-1' }),
        product({ id: 'p3', cost: 50, series: 'ser-2' })
      ];

      catalog.applyActiveOffers(products, [
        offer({ target: { kind: 'series', id: 'ser-1' }, discount: { type: 'percentOff', value: 50 } })
      ]);

      expect(products[0].salePrice).toBe(10);
      expect(products[1].salePrice).toBe(20);
      expect(products[2].salePrice).toBeUndefined();
    });

    it('takes the best of several live offers, not the first', () => {
      const catalog = makeCatalog();
      const products = [product({ cost: 20 })];

      catalog.applyActiveOffers(products, [
        offer({ campaignId: 'a', discount: { type: 'percentOff', value: 10 } }),
        offer({ campaignId: 'b', discount: { type: 'percentOff', value: 50 } })
      ]);

      expect(products[0].salePrice).toBe(10);
    });

    it('withholds an attribution-gated offer from an unattributed visitor', () => {
      const catalog = makeCatalog([], null);
      const products = [product({ cost: 20 })];

      catalog.applyActiveOffers(products, [offer({ requiresAttribution: true })]);

      expect(products[0].salePrice).toBeUndefined();
    });

    it('applies an attribution-gated offer to a visitor from that campaign', () => {
      const catalog = makeCatalog([], 'camp-1');
      const products = [product({ cost: 20 })];

      catalog.applyActiveOffers(products, [offer({ requiresAttribution: true })]);

      expect(products[0].salePrice).toBe(18);
    });

    it('does nothing when there are no active offers', () => {
      const catalog = makeCatalog();
      const products = [product({ cost: 20 })];

      catalog.applyActiveOffers(products, []);

      expect(products[0].salePrice).toBeUndefined();
    });
  });

  describe('productToCartItem', () => {
    let catalog: ProductCatalogService;

    beforeEach(() => {
      catalog = makeCatalog();
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
      catalog = makeCatalog();
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
      catalog = makeCatalog();
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
