import { Injectable } from '@angular/core';
import { Pager } from 'src/app/common/models/utils/pager.model';
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

  filterByCategory(products: ProductModel[], categoryId: string): ProductModel[] {
    return products.filter(p => p.category === categoryId).sort((a, b) => (a.categoryOrder ?? 0) - (b.categoryOrder ?? 0));
  }

  filterBySeries(products: ProductModel[], seriesId: string): ProductModel[] {
    return products.filter(p => p.series === seriesId).sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
  }

  /** Identical pagination math to the original getPager() (duplicated
   *  verbatim in store.component.ts / e-books.component.ts) -- moved here
   *  once so both store pages share it. */
  getPager(totalItems: number, currentPage = 1, pageSize = 9): Pager {
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
}
