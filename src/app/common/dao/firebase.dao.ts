import { Injectable } from '@angular/core';
import { addDoc, collectionData, deleteDoc, doc, docData, getDoc, getDocs, limit, orderBy, query, setDoc, where } from '@angular/fire/firestore';
import { Firestore, collection } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DocumentData, QueryConstraint, QuerySnapshot } from 'firebase/firestore';
import { BaseModel } from '../models/base.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDAO<T extends BaseModel> {

  constructor(public fs: Firestore ) {}

  // limitCount is optional and defaults to unbounded (existing behavior) --
  // pass it to cap how many documents a page pulls back instead of the
  // entire collection.
  public getAll(table: string, fromFirestore?, limitCount?: number): Promise<T[]>{
    const constraints: QueryConstraint[] = limitCount ? [limit(limitCount)] : [];

    return getDocs(query(collection(this.fs, '/' + table), ...constraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  // getAll() with a server-side orderBy(orderField, 'desc') so the newest
  // documents survive the limit() cap -- a plain limit() keeps whichever
  // docs Firestore returns first (doc-id order), not the newest. Single
  // field, no where clause, so no composite index is needed.
  public getAllOrdered(table: string, orderField: string, fromFirestore?, limitCount?: number): Promise<T[]>{
    const constraints: QueryConstraint[] = [orderBy(orderField, 'desc')];
    if (limitCount) constraints.push(limit(limitCount));

    return getDocs(query(collection(this.fs, '/' + table), ...constraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  public getAllByValue(table: string, field: string, value: unknown, fromFirestore?, limitCount?: number): Promise<T[]>{
    const constraints: QueryConstraint[] = [where(field, "==", value)];
    if (limitCount) constraints.push(limit(limitCount));

    return getDocs(query(collection(this.fs, '/' + table), ...constraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  public queryAllByMultiValue(table: string, queries: QueryParam[], fromFirestore?, limitCount?: number): Promise<T[]>{
    const queryConstraints: QueryConstraint[] = queries.map((query) =>
      where(query.field, query.operation, query.value),
    );
    if (limitCount) queryConstraints.push(limit(limitCount));

    return getDocs(query(collection(this.fs, '/' + table), ...queryConstraints)).then(docs => {
      return this.getDocListFromPromise(docs, fromFirestore);
    });
  }

  public getById(id: string, table: string, fromFirestore?): Promise<T>{
    return getDoc(doc(this.fs, '/' + table + '/' + id)).then(async doc => {
      if(doc.exists()){
        const retval: T = doc.data() as T;
        retval.id = doc.id;
        return fromFirestore? fromFirestore(retval) : retval;
      }
    })
  }

  // No read-back after the write: some collections are write-only for
  // anonymous visitors under firestore.rules (log-messages,
  // affilliate_sales, mail) -- the write succeeds but the read-back is
  // denied, failing the call after the data already landed. No writer in
  // this app uses serverTimestamp(), so echoing the input is equivalent.
  public add(value: T, table: string, fromFirestore?): Promise<T>{
    return addDoc(collection(this.fs, '/' + table), value).then(doc => {
      const retval = { ...value, id: doc.id };
      return fromFirestore ? fromFirestore(retval) : retval;
    });
  }

  public async update(id: string, value: T, table: string, fromFirestore?): Promise<T>{
    await setDoc(doc(this.fs, '/' + table + '/' + id), value);

    const retval = { ...value, id };
    return fromFirestore ? fromFirestore(retval) : retval;
  }

  public delete(id: string, table: string){
    return deleteDoc(doc(this.fs, '/' + table + '/' + id));
  }

  public streamAll(table: string, fromFirestore?, limitCount?: number): Observable<T[]>{
    const constraints: QueryConstraint[] = limitCount ? [limit(limitCount)] : [];

    return collectionData(query(collection(this.fs, '/' + table), ...constraints), {idField: 'id'}).pipe(
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

  public streamByValue(table: string, field: string, value: unknown, fromFirestore?, limitCount?: number): Observable<T[]>{
    const constraints: QueryConstraint[] = [where(field, "==", value)];
    if (limitCount) constraints.push(limit(limitCount));

    return collectionData(query(collection(this.fs, '/' + table), ...constraints), {idField: 'id'}).pipe(
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
  public streamByValueOrdered(table: string, field: string, value: unknown, orderField: string, fromFirestore?, limitCount?: number): Observable<T[]>{
    const constraints: QueryConstraint[] = [where(field, "==", value), orderBy(orderField, 'desc')];
    if (limitCount) constraints.push(limit(limitCount));

    return collectionData(query(collection(this.fs, '/' + table), ...constraints), {idField: 'id'}).pipe(
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
  public streamByDocId(id: string, table: string, fromFirestore?): Observable<T[]>{
    return docData(doc(this.fs, '/' + table + '/' + id), {idField: 'id'}).pipe(
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

  private getDocListFromStream(docs: (DocumentData | (DocumentData & {id: string}))[], fromFirestore){
    const retval: T[] = [];

    docs.forEach(doc => {
      const val: T = doc as T;
      val.id = doc.id;
      retval.push(fromFirestore? fromFirestore(val) :val);
    })

    return retval;
  }

  private getDocListFromPromise(docs: QuerySnapshot<DocumentData, DocumentData>, fromFirestore){
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
