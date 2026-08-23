import { Component, Input, OnChanges } from '@angular/core';
import { PublicGroupSummary } from '@impact-common/shared/contract/web-http.types';
import { PublicGroupService } from '../../services/public-group.service';

/**
 * "N groups are studying this book right now" - dropped onto the store's
 * product page, where the visitor is already looking at the book.
 *
 * Renders NOTHING at all when there are no groups for the book (or the
 * lookup fails): this sits inside someone else's page and must never leave
 * an empty heading or an error behind.
 */
@Component({
  selector: 'app-group-strip',
  standalone: false,
  templateUrl: './group-strip.component.html',
  styleUrls: ['./group-strip.component.scss'],
})
export class GroupStripComponent implements OnChanges {
  /** The library book id (a product's `digitalBookId`), not the product id. */
  @Input() bookId: string | undefined;

  groups: PublicGroupSummary[] = [];
  total = 0;

  constructor(private publicGroups: PublicGroupService) {}

  ngOnChanges(): void {
    void this.load();
  }

  get hasMore(): boolean {
    return this.total > this.groups.length;
  }

  private async load(): Promise<void> {
    this.groups = [];
    this.total = 0;
    if (!this.bookId) return;
    try {
      // Three fills one row at every breakpoint; the rest are one click away.
      const result = await this.publicGroups.search({ bookId: this.bookId, limit: 3 });
      this.groups = result.groups;
      this.total = result.total;
    } catch {
      // Silent by design - see the class comment.
      this.groups = [];
      this.total = 0;
    }
  }
}
