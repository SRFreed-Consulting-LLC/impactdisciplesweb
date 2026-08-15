import { Injectable } from '@angular/core';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { CourseModel } from 'src/app/common/models/domain/course.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class CourseService extends BaseService<CourseModel>{
  constructor(public override dao: FirebaseDAO<CourseModel> ) {
    super(dao)
    this.table="courses"
  }

  // Per-id promise cache so a pipe rendering the same course id across many
  // agenda rows (summit/event pages) triggers one Firestore read, not one
  // per row (P10). Courses don't change within a public visit, so a session-
  // lifetime cache is fine (same rationale as WebConfigService's cache). A
  // failed read is evicted so a transient error isn't cached permanently.
  private byIdCache = new Map<string, Promise<CourseModel>>();

  getByIdCached(id: string): Promise<CourseModel> {
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
