import { Injectable, signal } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { FirebaseDAO } from 'src/app/common/dao/firebase.dao';
import { PodCastModel } from 'src/app/common/models/domain/pod-cast.model';
import { dateFromTimestamp } from 'src/app/common/utils/date-from-timestamp';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PodCastService extends BaseService<PodCastModel>{
  constructor(public override dao: FirebaseDAO<PodCastModel> ) {
    super(dao)
    this.table="pod_casts"
    this.fromFirestore = PodCastService.fromFirestore
  }

  static readonly fromFirestore = (data): PodCastModel => {
    data.date = dateFromTimestamp(data.date as Timestamp)

    return data;
  };

  videos = signal<unknown[]>([]);

  // Was: fetch a raw YouTube Data API key from the server, then call
  // YouTube directly from the browser with that key embedded in the
  // request URL -- the key ended up in client JS and every outgoing
  // request, fully exposed to anyone who opened devtools. Also called a
  // Cloud Function (get_youtube_keys) that no longer exists, so this was
  // silently broken regardless. Now calls get_youtube_videos_public, which
  // does the YouTube call itself server-side (same pattern the admin app's
  // own staff-only get_youtube_videos already used) and returns just the
  // video list -- the API key never reaches the browser at all.
  async getVideoInfo(){
    this.videos = signal<unknown[]>([]);

    const response = await fetch(environment.youtubeVideosUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch YouTube videos');
    }

    const result = await response.json();
    this.videos.set(result.videos ?? []);

    return this.videos();
  }
}


