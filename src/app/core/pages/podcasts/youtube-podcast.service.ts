import { Injectable, inject } from '@angular/core';
import { PodCastModel } from '@impact-common/shared/models/domain/pod-cast.model';
import { GetYoutubePodcastsResult, YoutubePodcast } from '@impact-common/shared/contract/web-http.types';
import { CloudFunctionsClient } from 'src/app/common/services/data/cloud-functions.client';
import { environment } from 'src/environments/environment';

// The v2 podcast feed: episodes come straight from the YouTube playlist
// via get_youtube_podcasts_public, with no Firestore involvement at all.
// The pod_casts collection (and the admin screen that maintains it) exists
// only to serve the original PodcastsComponent; this service is the whole
// data layer for its replacement.
//
// Curation moves to YouTube itself: an episode is on the site because it
// is in the playlist, its title is the YouTube title, and its tags are the
// tags set in YouTube Studio. There is deliberately no isActive/category
// equivalent here.
@Injectable({
  providedIn: 'root'
})
export class YoutubePodcastService {
  private readonly client = inject(CloudFunctionsClient);

  // Kept for the life of the tab: the feed is identical for every visitor
  // and changes at most when a new episode is published, so navigating
  // away and back should not pay for the round trip again. The function
  // does its own 30-minute server-side caching on top of this.
  private cached: PodCastModel[] | null = null;

  async getPodcasts(): Promise<PodCastModel[]> {
    if (this.cached) {
      return this.cached;
    }

    const result = await this.client.get<GetYoutubePodcastsResult>(
      environment.youtubePodcastsUrl,
      { fallbackError: 'Failed to load podcasts from YouTube' }
    );

    this.cached = (result.videos ?? []).map(YoutubePodcastService.toPodCast);

    return this.cached;
  }

  // Maps a YouTube episode onto the same shape the existing podcast
  // sidebar and postbox-item components already render. That is the point:
  // those two components are reused verbatim by the v2 page rather than
  // duplicated, so both pages stay visually identical while they run side
  // by side. Nothing built here is ever written back to Firestore.
  // Public for its own sake AND for testing, matching
  // NewsletterArchiveService.parseList: the mapping is the one piece of
  // real logic here, and it is what has to stay right when the pod_casts
  // collection goes away.
  static toPodCast(video: YoutubePodcast): PodCastModel {
    return {
      id: video.id,
      // Everything in the playlist is live by definition - removing an
      // episode from the site means removing it from the playlist.
      isActive: true,
      date: new Date(video.publishedAt),
      title: video.title,
      videoType: 'Youtube',
      videoId: video.videoId,
      description: video.description,
      thumbnail: { name: video.title, url: video.thumbnailUrl },
      // TagModel is { tag }, and the search box reads .tag off each entry.
      tags: video.tags.map((tag) => ({ tag }))
    } as PodCastModel;
  }
}
