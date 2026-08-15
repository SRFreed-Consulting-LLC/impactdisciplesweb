import { Injectable } from '@angular/core';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { LocationModel } from 'src/app/common/models/domain/location.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService extends BaseService<LocationModel>{
  constructor(public override dao: FirebaseDAO<LocationModel> ) {
    super(dao)
    this.table="locations"
  }

  // Per-id promise cache so the location pipe rendering the same location id
  // across many event cards triggers one Firestore read, not one per card
  // (P10). Locations don't change within a public visit; a failed read is
  // evicted so a transient error isn't cached permanently.
  private byIdCache = new Map<string, Promise<LocationModel>>();

  getByIdCached(id: string): Promise<LocationModel> {
    if (!id) {
      return Promise.resolve(undefined);
    }
    if (!this.byIdCache.has(id)) {
      this.byIdCache.set(id, this.getById(id).catch((err) => {
        this.byIdCache.delete(id);
        throw err;
      }));
    }
    return this.byIdCache.get(id);
  }
}
