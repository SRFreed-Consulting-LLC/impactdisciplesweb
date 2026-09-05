import { Injectable } from '@angular/core';
import { addDoc, collectionData, deleteDoc, doc, docData, getDoc, getDocs, limit, orderBy, query, setDoc, where } from '@angular/fire/firestore';
import { Firestore, collection } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DocumentData, QueryConstraint, QuerySnapshot } from 'firebase/firestore';
import { BaseModel } from '@impact-common/shared/models/base.model';
import { tenantPath } from '@impact-common/shared/lists/tenancy';

// The per-collection deserialization hook a service may install (see
// BaseService.fromFirestore). It receives the raw document data with `id`
// already set and returns the model - in practice every implementation
// mutates and returns the same object (converting Timestamps to Dates).
export type FromFirestore<T> = (data: T) => T;

@Injectable({
  providedIn: 'root'
})
export class FirebaseDAO<T extends BaseModel> {

  constructor(public fs: Firestore ) {}

  /**
   * Where a collection actually lives.
   *
   * EVERY path in this class goes through here. A site's own content is
   * nested under `tenants/{tenantId}`; everything else is returned unchanged.
   * See the shared tenancy module for why, and for the list - the list is the
   * whole of the decision, so nothing in this file needs to know which is
   * which. The admin repo's own DAO carries the identical helper.
   */
  private path(table: string): string {
    return '/' + tenantPath(table);
  }

  // limitCount is optional and defaults to unbounded (existing behavior) --
  // pass it to cap how many documents a page pulls back instead of the
  // entire collection.
  public getAll(table: string, fromFirestore?: FromFirestore<T>, limitCount?: number): Promise<T[]>{
    const constraints: QueryConstraint[] = limitCount ? [limit(limitCount)] : [];

    return getDocs(query(collection(this.fs, this.path(table)), ...constraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  // getAll() with a server-side orderBy(orderField, 'desc') so the newest
  // documents survive the limit() cap -- a plain limit() keeps whichever
  // docs Firestore returns first (doc-id order), not the newest. Single
  // field, no where clause, so no composite index is needed.
  public getAllOrdered(table: string, orderField: string, fromFirestore?: FromFirestore<T>, limitCount?: number): Promise<T[]>{
    const constraints: QueryConstraint[] = [orderBy(orderField, 'desc')];
    if (limitCount) constraints.push(limit(limitCount));

    return getDocs(query(collection(this.fs, this.path(table)), ...constraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  public getAllByValue(table: string, field: string, value: unknown, fromFirestore?: FromFirestore<T>, limitCount?: number): Promise<T[]>{
    const constraints: QueryConstraint[] = [where(field, "==", value)];
    if (limitCount) constraints.push(limit(limitCount));

    return getDocs(query(collection(this.fs, this.path(table)), ...constraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  public queryAllByMultiValue(table: string, queries: QueryParam[], fromFirestore?: FromFirestore<T>, limitCount?: number): Promise<T[]>{
    const queryConstraints: QueryConstraint[] = queries.map((query) =>
      where(query.field, query.operation, query.value),
    );
    if (limitCount) queryConstraints.push(limit(limitCount));

    return getDocs(query(collection(this.fs, this.path(table)), ...queryConstraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  // Resolves undefined for a document that does not exist - it always did,
  // but until strict null checks (2026-09-05) the signature said Promise<T>
  // and every caller was free to dereference the result. Callers guard.
  public getById(id: string, table: string, fromFirestore?: FromFirestore<T>): Promise<T | undefined>{
    return getDoc(doc(this.fs, this.path(table) + '/' + id)).then(async doc => {
      if(doc.exists()){
        const retval: T = doc.data() as T;
        retval.id = doc.id;
        return fromFirestore? fromFirestore(retval) : retval;
      }
      return undefined;
    })
  }

  // No read-back after the write: some collections are write-only for
  // anonymous visitors under firestore.rules (log-messages,
  // affilliate_sales, mail) -- the write succeeds but the read-back is
  // denied, failing the call after the data already landed. No writer in
  // this app uses serverTimestamp(), so echoing the input is equivalent.
  public add(value: T, table: string, fromFirestore?: FromFirestore<T>): Promise<T>{
    return addDoc(collection(this.fs, this.path(table)), value).then(doc => {
      const retval = { ...value, id: doc.id };
      return fromFirestore ? fromFirestore(retval) : retval;
    });
  }

  public async update(id: string, value: T, table: string, fromFirestore?: FromFirestore<T>): Promise<T>{
    await setDoc(doc(this.fs, this.path(table) + '/' + id), value);

    const retval = { ...value, id };
    return fromFirestore ? fromFirestore(retval) : retval;
  }

  public delete(id: string, table: string){
    return deleteDoc(doc(this.fs, this.path(table) + '/' + id));
  }

  public streamAll(table: string, fromFirestore?: FromFirestore<T>, limitCount?: number): Observable<T[]>{
    const constraints: QueryConstraint[] = limitCount ? [limit(limitCount)] : [];

    return collectionData(query(collection(this.fs, this.path(table)), ...constraints), {idField: 'id'}).pipe(
      map(docs => {
        return this.getDocListFromStream(docs, fromFirestore);
      }),
      // Without this, a failed/offline/permission-denied listener just
      // errors the observable silently -- no error callback is registered
      // at most call sites, so the UI is left showing stale/empty data
      // forever with no visible sign anything went wrong. Log it and fall
      // back to an empty list instead.
      catchError(err => {
        console.error(`FirebaseDAO.streamAll('${table}') failed:`, err);
        return of([]);
      })
    );
  }

  public streamByValue(table: string, field: string, value: unknown, fromFirestore?: FromFirestore<T>, limitCount?: number): Observable<T[]>{
    const constraints: QueryConstraint[] = [where(field, "==", value)];
    if (limitCount) constraints.push(limit(limitCount));

    return collectionData(query(collection(this.fs, this.path(table)), ...constraints), {idField: 'id'}).pipe(
      map(docs => {
        return this.getDocListFromStream(docs, fromFirestore);
      }),
      catchError(err => {
        console.error(`FirebaseDAO.streamByValue('${table}', '${field}') failed:`, err);
        return of([]);
      })
    );
  }

  // streamByValue() with a server-side orderBy(orderField, 'desc') so the
  // newest documents survive the limit() cap (see getAllOrdered() above).
  // NOTE: where(field, '==', ...) combined with orderBy(orderField) on a
  // different field REQUIRES a composite index on the collection -- the
  // query hard-fails with failed-precondition until that index is READY
  // (declared in the admin repo's firestore.indexes.json, which owns index
  // deployment for this database).
  public streamByValueOrdered(table: string, field: string, value: unknown, orderField: string, fromFirestore?: FromFirestore<T>, limitCount?: number): Observable<T[]>{
    const constraints: QueryConstraint[] = [where(field, "==", value), orderBy(orderField, 'desc')];
    if (limitCount) constraints.push(limit(limitCount));

    return collectionData(query(collection(this.fs, this.path(table)), ...constraints), {idField: 'id'}).pipe(
      map(docs => {
        return this.getDocListFromStream(docs, fromFirestore);
      }),
      catchError(err => {
        console.error(`FirebaseDAO.streamByValueOrdered('${table}', '${field}', '${orderField}') failed:`, err);
        return of([]);
      })
    );
  }

  // Observable, single-document counterpart to streamByValue() above.
  // Added for BaseService.streamById() (see its own comment): querying a
  // collection by an 'id' field via streamByValue() briefly emits an empty
  // array before the real snapshot arrives (and permanently emits one for
  // a bad/deleted id), which is a real latent crash source for any caller
  // that assumes element 0 exists as soon as the stream fires.
  public streamByDocId(id: string, table: string, fromFirestore?: FromFirestore<T>): Observable<T[]>{
    return docData(doc(this.fs, this.path(table) + '/' + id), {idField: 'id'}).pipe(
      map(data => {
        if (!data) return [];
        const val = data as T;
        return [fromFirestore ? fromFirestore(val) : val];
      }),
      catchError(err => {
        console.error(`FirebaseDAO.streamByDocId('${table}', '${id}') failed:`, err);
        return of([]);
      })
    );
  }

  private getDocListFromStream(docs: (DocumentData | (DocumentData & {id: string}))[], fromFirestore?: FromFirestore<T>){
    const retval: T[] = [];

    docs.forEach(doc => {
      const val: T = doc as T;
      val.id = doc.id;
      retval.push(fromFirestore? fromFirestore(val) :val);
    })

    return retval;
  }

  private getDocListFromPromise(docs: QuerySnapshot<DocumentData, DocumentData>, fromFirestore?: FromFirestore<T>){
    const retval: T[] = [];

    docs.forEach(doc => {
      const val: T = doc.data() as T;
      val.id = doc.id;
      retval.push(fromFirestore? fromFirestore(val) :val);
    })

    return retval;
  }

}




export enum WhereFilterOperandKeys {
  less = '<',
  lessOrEqual = '<=',
  equal = '==',
  notEqual = '!=',
  more = '>',
  moreOrEqual = '>=',
  arrayContains = 'array-contains',
  in = 'in',
  arrayContainsAny = 'array-contains-any',
  notIn = 'not-in',
}

export class QueryParam {
  constructor(field: string, operation: WhereFilterOperandKeys, value: unknown) {
    this.field = field;
    this.operation = operation;
    this.value = value;
  }
  field: string;
  value: unknown;
  operation: WhereFilterOperandKeys;
}
