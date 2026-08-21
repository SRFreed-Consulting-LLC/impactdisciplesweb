import { Injectable } from '@angular/core';
import { Pager } from 'src/app/common/models/utils/pager.model';
import { ProductModel } from '@impact-common/shared/models/utils/product.model';
import { SaleModel } from '@impact-common/shared/models/utils/sale.model';
import { SalesService } from 'src/app/common/services/data/sales.service';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { CartItem } from '@impact-common/shared/models/utils/cart.model';

// Shared home for the browse/filter/pager logic that the original app
// duplicates verbatim across store.component.ts and e-books.component.ts
// (getPager, active-sale lookup) and near-verbatim across
// store-postbox-item.component.ts / product-details.component.ts
// (CartItem-from-ProductModel construction). store's own
// StoreComponent and EBooksComponent both orchestrate over this
// instead of each carrying their own copy. Only reads existing
// SalesService/ProductModel/CartItem -- none of them are modified.
@Injectable({ providedIn: 'root' })
export class ProductCatalogService {
  // getActiveSales() used to be called independently (a full Firestore
  // query, no caching) from every page that needs it -- store, e-books,
  // product-details, and checkout (which had its own hand-duplicated copy
  // of this exact method instead of calling it at all). A single
  // browse-to-checkout session could trigger up to 4 redundant reads of
  // the same `sales` collection. Cached the same way WebConfigService
  // already caches config -- see that service's own comment for the
  // session-lived-singleton reasoning.
  private cachedActiveSales: Promise<SaleModel[]> | null = null;

  constructor(private salesService: SalesService) {}

  async getActiveSales(): Promise<SaleModel[]> {
    if (!this.cachedActiveSales) {
      this.cachedActiveSales = this.salesService.getAllByValue('isActive', true).then(sales => {
        const today = new Date();
        return sales.filter(sale => {
          const startDate = new Date(sale.startDate as string);
          const endDate = new Date(sale.endDate as string);
          return startDate.getTime() <= today.getTime() && endDate.getTime() >= today.getTime();
        });
      });
    }

    return this.cachedActiveSales;
  }

  /** Mutates each product's salePrice in place from the first active
   *  isProducts sale found, matching the original store's behavior --
   *  request-scoped, never persisted back to Firestore. */
  applyActiveProductSale(products: ProductModel[], activeSales: SaleModel[]): void {
    const productSale = activeSales.find(sale => sale.isProducts);
    if (!productSale) return;

    const percentOff = NumberUtil.clampPercent(productSale.percentOff);
    products.forEach(product => {
      product.salePrice = product.cost - (percentOff / 100 * product.cost);
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
      followUpEmailId: product.sendFollowUpEmail && product.followUpEmailId ? product.followUpEmailId : ''
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
