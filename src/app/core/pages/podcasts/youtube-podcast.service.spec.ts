import { TestBed } from '@angular/core/testing';
import { CloudFunctionsClient } from 'src/app/common/services/data/cloud-functions.client';
import { YoutubePodcast } from '@impact-common/shared/contract/web-http.types';
import { YoutubePodcastService } from './youtube-podcast.service';

// Written before the pod_casts collection (and the admin screen that
// maintains it) is retired. toPodCast is the seam that lets the v2 page
// reuse the existing sidebar/postbox-item components unchanged, so the
// shape it produces has to keep matching PodCastModel exactly - if it
// drifts, both child components render blanks with no compile error to
// catch it (their @Input is typed, but the object is built with a cast).
//
// TestBed is used as the injector rather than `new`: the service takes its
// dependency via inject(), so it can only be constructed inside an
// injection context.

const episode = (over: Partial<YoutubePodcast> = {}): YoutubePodcast => ({
  id: 'PLitem1',
  videoId: 'vid1',
  title: 'Making Disciples in a Distracted Age',
  description: 'A conversation with a guest about attention.',
  publishedAt: '2026-03-04T15:00:00.000Z',
  thumbnailUrl: 'https://i.ytimg.com/vi/vid1/maxres.jpg',
  tags: ['discipleship', 'attention'],
  ...over
});

describe('YoutubePodcastService.toPodCast', () => {
  it('maps a YouTube episode onto the PodCastModel shape the sidebar reads', () => {
    const podcast = YoutubePodcastService.toPodCast(episode());

    expect(podcast.id).toBe('PLitem1');
    expect(podcast.videoId).toBe('vid1');
    expect(podcast.videoType).toBe('Youtube');
    expect(podcast.title).toBe('Making Disciples in a Distracted Age');
    expect(podcast.description).toBe('A conversation with a guest about attention.');
    // Both child components read thumbnail.url; the sidebar dereferences it
    // without a guard, so it must never be absent.
    expect(podcast.thumbnail?.url).toBe('https://i.ytimg.com/vi/vid1/maxres.jpg');
    expect(podcast.thumbnail?.name).toBe('Making Disciples in a Distracted Age');
  });

  it('parses publishedAt into a real Date, since the templates date-pipe it', () => {
    const podcast = YoutubePodcastService.toPodCast(episode());

    expect(podcast.date instanceof Date).toBe(true);
    expect((podcast.date as Date).toISOString()).toBe('2026-03-04T15:00:00.000Z');
  });

  it('marks everything active - playlist membership is the only filter now', () => {
    expect(YoutubePodcastService.toPodCast(episode()).isActive).toBe(true);
  });

  it('maps tag strings to TagModel objects, which is what search reads', () => {
    const podcast = YoutubePodcastService.toPodCast(episode());

    expect(podcast.tags).toEqual([{ tag: 'discipleship' }, { tag: 'attention' }]);
  });

  it('handles an episode with no tags set in YouTube Studio', () => {
    const podcast = YoutubePodcastService.toPodCast(episode({ tags: [] }));

    expect(podcast.tags).toEqual([]);
  });

  it('carries no category - the concept does not exist on YouTube', () => {
    expect(YoutubePodcastService.toPodCast(episode()).category).toBeUndefined();
  });
});

describe('YoutubePodcastService.getPodcasts', () => {
  let get: jasmine.Spy;
  let service: YoutubePodcastService;

  beforeEach(() => {
    get = jasmine.createSpy('get').and.returnValue(
      Promise.resolve({ videos: [episode(), episode({ id: 'PLitem2', videoId: 'vid2' })] })
    );

    TestBed.configureTestingModule({
      providers: [{ provide: CloudFunctionsClient, useValue: { get } }]
    });

    service = TestBed.inject(YoutubePodcastService);
  });

  it('maps every episode the function returns', async () => {
    const podcasts = await service.getPodcasts();

    expect(podcasts.length).toBe(2);
    expect(podcasts.map(p => p.videoId)).toEqual(['vid1', 'vid2']);
  });

  it('fetches once per tab and serves the cache after that', async () => {
    await service.getPodcasts();
    await service.getPodcasts();

    expect(get).toHaveBeenCalledTimes(1);
  });

  it('tolerates a response with no videos array', async () => {
    get.and.returnValue(Promise.resolve({}));

    expect(await service.getPodcasts()).toEqual([]);
  });

  it('lets a failure reach the caller, so the page can show its error state', async () => {
    get.and.returnValue(Promise.reject(new Error('Failed to load podcasts from YouTube')));

    await expectAsync(service.getPodcasts()).toBeRejectedWithError('Failed to load podcasts from YouTube');
  });

  it('does not cache a failure - a retry hits the function again', async () => {
    get.and.returnValue(Promise.reject(new Error('boom')));
    await expectAsync(service.getPodcasts()).toBeRejected();

    get.and.returnValue(Promise.resolve({ videos: [episode()] }));
    expect((await service.getPodcasts()).length).toBe(1);
    expect(get).toHaveBeenCalledTimes(2);
  });
});
