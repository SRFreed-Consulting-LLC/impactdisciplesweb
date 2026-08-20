import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Pager } from 'src/app/common/models/utils/pager.model';

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    standalone: false
})
export class PaginationComponent {

  // Bound but never actually read inside this component - genuinely
  // polymorphic across callers (DMMModel[], ProductModel[], PodCastModel[]...).
  @Input() data: unknown[] = [];
  @Input() paginate: Pager = {};

  @Output() setPage: EventEmitter<number> = new EventEmitter<number>();

  pageSet(page: number) {
    this.setPage.emit(page); // Set Page Number
  }

}
