import { Component, DestroyRef, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { PublicGroupSummary } from '@impact-common/shared/contract/web-http.types';
import { PublicGroupService } from '../../services/public-group.service';
import { ProductService } from 'src/app/common/services/data/product.service';
import { ProductModel } from '@impact-common/shared/models/utils/product.model';
import {
  capacityLine,
  fillPercent,
  isFull,
  locationLine,
  meetingBadge,
  whenLine,
} from '../../utils/group-display.util';

/**
 * A single Impact Group, as a public, shareable page. Everything it shows
 * comes from the sanitised projection - there is no signed-in read here and
 * no way to join from this site; the CTA hands off to the reader.
 */
@Component({
  selector: 'app-group-public-detail',
  standalone: false,
  templateUrl: './group-public-detail.component.html',
  styleUrls: ['./group-public-detail.component.scss'],
})
export class GroupPublicDetailComponent implements OnInit {
  group: PublicGroupSummary | undefined;
  book: ProductModel | undefined;
  loading = true;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private publicGroups: PublicGroupService,
    private productService: ProductService,
    private title: Title,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        void this.load(params.get('groupId'));
      });
  }

  get badge(): string {
    return this.group ? meetingBadge(this.group) : '';
  }

  get where(): string {
    return this.group ? locationLine(this.group) : '';
  }

  get when(): string {
    return this.group ? whenLine(this.group) : '';
  }

  get capacity(): string {
    return this.group ? capacityLine(this.group) : '';
  }

  get full(): boolean {
    return !!this.group && isFull(this.group);
  }

  get fill(): number | undefined {
    return this.group ? fillPercent(this.group) : undefined;
  }

  /**
   * True when the group has a street address to show. A hidden address is
   * the leader's recorded choice and the function never sends it, so this
   * is purely about which explanatory line to render.
   */
  get hasAddress(): boolean {
    return !!this.group?.address1;
  }

  get addressHidden(): boolean {
    return !!this.group && this.group.meetingType !== 'online' && !this.group.address1;
  }

  get joinUrl(): string {
    return this.group ? this.publicGroups.joinUrl(this.group.id) : '';
  }

  get createUrl(): string {
    return this.publicGroups.createUrl(this.group?.bookId);
  }

  private async load(groupId: string | null): Promise<void> {
    if (!groupId) {
      this.notFound = true;
      this.loading = false;
      return;
    }
    this.loading = true;
    this.notFound = false;
    try {
      this.group = await this.publicGroups.getById(groupId);
      this.notFound = !this.group;
      if (this.group) {
        this.title.setTitle(`${this.group.title} | Impact Groups`);
        this.loadBook(this.group.bookId);
      }
    } catch {
      // A failed fetch and a genuinely missing group look the same to a
      // visitor, and the page says the same useful thing either way.
      this.notFound = true;
    } finally {
      this.loading = false;
    }
  }

  /**
   * The matching store product, for the "add to cart" cross-sell. Best
   * effort - a group can name a book that is not sold on this site, and the
   * page must render fine without it.
   */
  private loadBook(bookId: string): void {
    if (!bookId) return;
    this.productService
      .streamAllByValue('isActive', true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products: ProductModel[]) => {
        this.book = products.find((p) => p.digitalBookId === bookId);
      });
  }
}
