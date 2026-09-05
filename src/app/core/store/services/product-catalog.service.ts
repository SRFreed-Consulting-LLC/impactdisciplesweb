import { Injectable } from '@angular/core';
import { Pager, buildPager } from 'src/app/common/models/utils/pager.model';
import { ProductModel } from '@impact-common/shared/models/utils/product.model';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { CartItem } from '@impact-common/shared/models/utils/cart.model';
import {
  CampaignOfferModel,
  bestOfferPrice
} from '@impact-common/shared/models/utils/campaign-offer.model';
import { CampaignOfferService } from 'src/app/common/services/data/campaign-offer.service';
import { AttributionService } from 'src/app/shared/utils/services/attribution.service';

// Shared home for the browse/filter/pager logic that the original app
// duplicates verbatim across store.component.ts and e-books.component.ts
// (getPager, active-sale lookup) and near-verbatim across
// store-postbox-item.component.ts / product-details.component.ts
// (CartItem-from-ProductModel construction). store's own
// StoreComponent and EBooksComponent both orchestrate over this
// instead of each carrying their own copy.
@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  constructor(
    private offerService: CampaignOfferService,
    private attributionService: AttributionService
  ) {}

  /**
   * Every currently-active campaign offer (Campaign Manager v3).
   *
   * Cached in CampaignOfferService itself rather than here, since offers are
   * read by pages outside the store too.
   */
  getActiveOffers(): Promise<CampaignOfferModel[]> {
    return this.offerService.getActiveOffers();
  }

  /**
   * Mutates each product's salePrice in place from the campaign offers that
   * actually reach it - request-scoped, never persisted back to Firestore.
   *
   * Replaces applyActiveProductSale(), which took the FIRST active isProducts
   * sale and rewrote EVERY product's price from it: a product nobody put on
   * sale still got discounted, a second active sale was silently ignored, and
   * a product's own salePrice was overwritten either way.
   *
   * A product with no applicable offer is now left ALONE rather than assigned
   * a price, so an untargeted product keeps its base cost.
   *
   * Which offers reach a product is decided by the shared bestOfferPrice() -
   * the same function the admin previews with, so the two cannot disagree
   * about what a shopper is charged. Attribution is passed through for offers
   * only visible to visitors who arrived via the campaign link (the event
   * early-bird rule).
   */
  applyActiveOffers(products: ProductModel[], offers: CampaignOfferModel[]): void {
    if (!offers?.length) {
      return;
    }
    const now = Date.now();
    const attributedCampaignId = this.attributionService.get()?.campaignId ?? null;

    products.forEach(product => {
      const price = bestOfferPrice(
        offers,
        { kind: 'product', id: product.id ?? '', series: product.series ?? null },
        NumberUtil.isNumber(product.cost) ? product.cost : 0,
        now,
        attributedCampaignId
      );
      if (price !== null) {
        product.salePrice = price;
      }
    });
  }

  productToCartItem(product: ProductModel, opts?: { size?: string; color?: string; language?: string }): CartItem {
    return {
      id: product.id,
      itemName: product.title,
      orderQuantity: 1,
      price: NumberUtil.isNumber(product.cost) ? product.cost : 0,
      salePrice: NumberUtil.isNumber(product.salePrice) ? product.salePrice : 0,
      img: product.imageUrl,
      isEvent: false,
      isEBook: !!product.isEBook,
      isDigitalBook: !!product.isDigitalBook,
      digitalBookId: product.digitalBookId ?? '',
      eBookUrl: product.eBookUrl ?? null,
      weight: product.weight ?? 0,
      uom: product.uom,
      size: opts?.size,
      color: opts?.color,
      language: opts?.language,
      followUpEmailId: product.sendFollowUpEmail && product.followUpEmailId ? product.followUpEmailId : '',
      // Travels with the line so checkout can match a series-targeted offer.
      series: product.series ?? null
    };
  }

  sortByAZ(products: ProductModel[]): ProductModel[] {
    return [...products].sort((a, b) => a.title.localeCompare(b.title));
  }

  sortByPriceAsc(products: ProductModel[]): ProductModel[] {
    // Was: a missing cost unconditionally sorted first regardless of the
    // other side's cost (even against another missing-cost item), which
    // was also inconsistent with sortByPriceDesc's own null handling
    // (coerced to 0, i.e. sorts as the cheapest item either direction) -
    // found auditing all filter dropdown options together. Matching that
    // same ?? 0 treatment here instead.
    return [...products].sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
  }

  sortByPriceDesc(products: ProductModel[]): ProductModel[] {
    return [...products].sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));
  }

  // Both accept an absent id (a tag or series document's id is optional in
  // type) and simply match nothing, which is what they always did.
  filterByCategory(products: ProductModel[], categoryId: string | undefined): ProductModel[] {
    return products.filter(p => p.category === categoryId).sort((a, b) => (a.categoryOrder ?? 0) - (b.categoryOrder ?? 0));
  }

  filterBySeries(products: ProductModel[], seriesId: string | undefined): ProductModel[] {
    return products.filter(p => p.series === seriesId).sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
  }

  /** The shared pagination math - buildPager() in pager.model.ts since
   *  2026-09-05 (dmm and podcasts use it directly). Kept as a method so
   *  e-books.component.ts and this service's spec are untouched. */
  getPager(totalItems: number, currentPage = 1, pageSize = 9): Pager {
    return buildPager(totalItems, currentPage, pageSize);
  }
}
