import { NewsletterArchiveService } from './newsletter-archive.service';

// Pure-shape coverage of the public newsletter archive client: parseList
// is what the Monthly Newsletter page renders from, so it must tolerate a
// missing/odd payload (function down, wrong shape) without throwing.
describe('NewsletterArchiveService.parseList', () => {
  it('maps well-formed items and parses ISO dates', () => {
    const items = NewsletterArchiveService.parseList({
      newsletters: [
        { id: 'mc_1', title: ' Impact October 2025 ', date: '2025-10-03T14:00:00.000Z' }
      ]
    });
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('mc_1');
    expect(items[0].title).toBe('Impact October 2025');
    expect(items[0].date?.toISOString()).toBe('2025-10-03T14:00:00.000Z');
  });

  it('falls back on title and tolerates null/invalid dates', () => {
    const items = NewsletterArchiveService.parseList({
      newsletters: [
        { id: 'a', title: '', date: null },
        { id: 'b', date: 'not-a-date' }
      ]
    });
    expect(items.map(i => i.title)).toEqual(['Newsletter', 'Newsletter']);
    expect(items.map(i => i.date)).toEqual([null, null]);
  });

  it('drops entries without a string id and survives garbage payloads', () => {
    expect(NewsletterArchiveService.parseList({ newsletters: [{ title: 'no id' }, null, { id: 'ok' }] }).map(i => i.id)).toEqual(['ok']);
    expect(NewsletterArchiveService.parseList(null)).toEqual([]);
    expect(NewsletterArchiveService.parseList({})).toEqual([]);
    expect(NewsletterArchiveService.parseList({ newsletters: 'nope' })).toEqual([]);
  });
});
