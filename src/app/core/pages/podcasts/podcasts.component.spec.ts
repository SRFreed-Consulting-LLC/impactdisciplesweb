import { of } from 'rxjs';
import { ViewportScroller } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { PodcastsComponent } from './podcasts.component';
import { YoutubePodcastService } from './youtube-podcast.service';

// The v2 podcast page's own logic: what it does while the Cloud Function
// is in flight, what it does when that call fails, and how search behaves
// now that it runs over an in-memory array instead of a Firestore query.
//
// TestBed is used purely as an injector (no template compilation): the
// component takes every dependency via inject(), so it cannot be `new`ed,
// and building it this way keeps the child components - which are reused
// verbatim from the original page - out of the picture entirely.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const podcast = (title: string, tags: string[], description = '', date = '2026-01-01') => ({
  id: title,
  isActive: true,
  date: new Date(date),
  title,
  videoType: 'Youtube',
  videoId: title,
  description,
  thumbnail: { name: title, url: 'https://i.ytimg.com/x.jpg' },
  tags: tags.map(tag => ({ tag }))
});

const build = (getPodcasts: jasmine.Spy) => {
  TestBed.configureTestingModule({
    providers: [
      PodcastsComponent,
      { provide: YoutubePodcastService, useValue: { getPodcasts } },
      { provide: WebConfigService, useValue: { getAll: () => Promise.resolve([{ youtube: 'https://youtube.test' }]) } },
      { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      { provide: ViewportScroller, useValue: { setOffset: () => undefined } }
    ]
  });

  return TestBed.inject(PodcastsComponent);
};

describe('PodcastsComponent loading state', () => {
  it('starts loading and clears it once the feed arrives', async () => {
    const component = build(jasmine.createSpy().and.returnValue(Promise.resolve([podcast('One', [])])));

    expect(component.loading).toBe(true);

    component.ngOnInit();
    await flush();

    expect(component.loading).toBe(false);
    expect(component.loadError).toBe('');
    expect(component.podcasts.length).toBe(1);
  });

  it('highlights the newest episode, which the function returns first', async () => {
    const component = build(jasmine.createSpy().and.returnValue(
      Promise.resolve([podcast('Newest', [], '', '2026-05-01'), podcast('Older', [], '', '2024-01-01')])
    ));

    component.ngOnInit();
    await flush();

    expect(component.selectedPodcast.title).toBe('Newest');
    expect(component.isListView).toBe(false);
  });

  it('surfaces the failure message and stops loading when the function is down', async () => {
    const component = build(jasmine.createSpy().and.returnValue(Promise.reject(new Error('YouTube is unavailable'))));

    component.ngOnInit();
    await flush();

    expect(component.loading).toBe(false);
    expect(component.loadError).toBe('YouTube is unavailable');
    expect(component.podcasts).toEqual([]);
  });

  it('falls back to generic wording when the rejection carries no message', async () => {
    const component = build(jasmine.createSpy().and.returnValue(Promise.reject(new Error(''))));

    component.ngOnInit();
    await flush();

    expect(component.loadError).toBe('Failed to load podcasts from YouTube');
  });
});

describe('PodcastsComponent search', () => {
  let component: PodcastsComponent;

  beforeEach(async () => {
    component = build(jasmine.createSpy().and.returnValue(Promise.resolve([
      podcast('Making Disciples', ['discipleship'], 'Guest: Pat Rivera talks about small groups.'),
      podcast('Leading Well', ['leadership', 'church'], 'On pastoral burnout.'),
      podcast('Prayer Basics', [], 'Nothing tagged here at all.')
    ])));

    component.ngOnInit();
    await flush();
  });

  it('matches on title, case-insensitively', () => {
    component.searchPodcasts('making');

    expect(component.filteredPodcasts.map(p => p.title)).toEqual(['Making Disciples']);
    expect(component.isListView).toBe(true);
  });

  it('matches on a YouTube tag', () => {
    component.searchPodcasts('leadership');

    expect(component.filteredPodcasts.map(p => p.title)).toEqual(['Leading Well']);
  });

  it('matches on description, which is where guest names live', () => {
    component.searchPodcasts('pat rivera');

    expect(component.filteredPodcasts.map(p => p.title)).toEqual(['Making Disciples']);
  });

  it('searches episodes that have no tags without throwing', () => {
    component.searchPodcasts('prayer');

    expect(component.filteredPodcasts.map(p => p.title)).toEqual(['Prayer Basics']);
  });

  it('clears the highlighted episode so the list view takes over', () => {
    component.searchPodcasts('making');

    expect(component.selectedPodcast).toBeNull();
  });

  it('returns nothing for a term that matches no field', () => {
    component.searchPodcasts('zzzz');

    expect(component.filteredPodcasts).toEqual([]);
  });

  it('restores the full first page when the filter is cleared', () => {
    component.searchPodcasts('making');
    component.clearFilters();

    expect(component.filteredPodcasts.length).toBe(3);
    expect(component.selectedPodcast).toBeNull();
  });
});

describe('PodcastsComponent pagination', () => {
  it('slices the in-memory feed to the page size, with no per-page query', async () => {
    const many = Array.from({ length: 14 }, (_, i) => podcast(`Episode ${i}`, []));
    const getPodcasts = jasmine.createSpy().and.returnValue(Promise.resolve(many));
    const component = build(getPodcasts);

    component.ngOnInit();
    await flush();

    expect(component.podcasts.length).toBe(14);
    expect(component.filteredPodcasts.length).toBe(component.pageSize);
    expect(component.paginate.totalPages).toBe(3);
    // One call for the whole feed - paging never goes back to the network.
    expect(getPodcasts).toHaveBeenCalledTimes(1);
  });
});
