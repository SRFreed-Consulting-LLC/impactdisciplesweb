import { Injectable } from '@angular/core';
import { Pager } from 'src/app/common/models/utils/pager.model';
import { ProductModel } from 'src/app/common/models/utils/product.model';
import { SaleModel } from 'src/app/common/models/utils/sale.model';
import { SalesService } from 'src/app/common/services/data/sales.service';
import { NumberUtil } from 'src/app/common/utils/number-util';
import { CartItem } from 'src/app/common/models/utils/cart.model';

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
  constructor(private salesService: SalesService) {}

  async getActiveSales(): Promise<SaleModel[]> {
    const sales = await this.salesService.getAllByValue('isActive', true);
    const today = new Date();

    return sales.filter(sale => {
      const startDate = new Date(sale.startDate as string);
      const endDate = new Date(sale.endDate as string);
      return startDate.getTime() <= today.getTime() && endDate.getTime() >= today.getTime();
    });
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
    return [...products].sort((a, b) => {
      if (a.cost == null) return -1;
      if (b.cost == null) return 1;
      return a.cost - b.cost;
    });
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
