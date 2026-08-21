import { Injectable } from '@angular/core';
import { FirebaseDAO, QueryParam } from 'src/app/common/dao/firebase.dao';
import { BaseModel } from '@impact-common/shared/models/base.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BaseService<T extends BaseModel> {
  public table = '';
  public fromFirestore;

  constructor(public dao: FirebaseDAO<T>) {}

  // limitCount is optional everywhere below and defaults to unbounded
  // (existing behavior) -- pass it from a page/component to cap how many
  // documents a list/stream query pulls back instead of the whole collection.
  getAll(limitCount?: number): Promise<T[]>{
    return this.dao.getAll(this.table, this.fromFirestore, limitCount);
  }

  // getAll() ordered newest-first on orderField (server-side orderBy desc)
  // so a limitCount cap keeps the newest documents, not doc-id order.
  getAllOrdered(orderField: string, limitCount?: number): Promise<T[]>{
    return this.dao.getAllOrdered(this.table, orderField, this.fromFirestore, limitCount);
  }

  getAllByValue(field: string, value: unknown, limitCount?: number): Promise<T[]>{
    return this.dao.getAllByValue(this.table, field, value, this.fromFirestore, limitCount);
  }

  queryAllByMultiValue(queries: QueryParam[], limitCount?: number): Promise<T[]>{
    return this.dao.queryAllByMultiValue(this.table, queries, this.fromFirestore, limitCount)
  }

  getById(id: string): Promise<T>{
    return this.dao.getById(id, this.table, this.fromFirestore);
  }

  streamAll(limitCount?: number): Observable<T[]>{
    return this.dao.streamAll(this.table, this.fromFirestore, limitCount)
  }

  streamAllByValue(field: string, value: unknown, limitCount?: number): Observable<T[]>{
    return this.dao.streamByValue(this.table, field, value, this.fromFirestore, limitCount)
  }

  // streamAllByValue() ordered newest-first on orderField so a limitCount
  // cap keeps the newest documents. Requires a composite index on
  // (field ASC, orderField DESC) -- see FirebaseDAO.streamByValueOrdered().
  streamAllByValueOrdered(field: string, value: unknown, orderField: string, limitCount?: number): Observable<T[]>{
    return this.dao.streamByValueOrdered(this.table, field, value, orderField, this.fromFirestore, limitCount)
  }

  // streamByDocId(), not streamByValue(this.table, 'id', id, ...) --
  // querying a collection by an 'id' field briefly emits an empty array
  // before the real snapshot arrives (and permanently emits one for a
  // bad/deleted id), which crashed callers that assumed element 0 exists
  // as soon as the stream fires (see product-details.component.ts's own
  // comment on the null-check this required). Reading the document
  // directly by id doesn't have that gap.
  streamById(id: string): Observable<T[]>{
    return this.dao.streamByDocId(id, this.table, this.fromFirestore);
  }

  add(value: T): Promise<T>{
    return this.dao.add(value, this.table, this.fromFirestore);
  }

  update(id: string, value: T): Promise<T>{
    return this.dao.update(id, value, this.table, this.fromFirestore);
  }

  delete(id: string){
    return this.dao.delete(id, this.table);
  }
}
