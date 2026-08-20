import { AttributionService, CampaignAttribution } from './attribution.service';

// Must match the service's module-level STORAGE_KEY.
const STORAGE_KEY = 'campaign-attribution';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

// The URL-capture half of the service (constructor reading
// window.location.search) is NOT testable here: window.location isn't
// fakeable in a browser Karma run and the capture happens in the
// constructor. Karma's context page carries no ?cid, so constructing the
// service in these specs exercises the real "no campaign params" path;
// everything else is driven by crafting localStorage entries directly,
// exactly what the constructor would have written.
function storedEntry(fields: Record<string, unknown>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
}

describe('AttributionService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  describe('constructor (no campaign params on the Karma page URL)', () => {
    it('writes nothing to storage when the URL carries no cid', () => {
      new AttributionService();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('leaves an existing stored attribution untouched (no clobber without a new touch)', () => {
      storedEntry({ campaignId: 'camp-1', source: 'email', at: Date.now() });

      const service = new AttributionService();

      expect(service.get()).toEqual({ campaignId: 'camp-1', source: 'email' });
    });
  });

  describe('get()', () => {
    it('returns null when nothing is stored', () => {
      expect(new AttributionService().get()).toBeNull();
    });

    it('returns a fresh attribution with all stored fields', () => {
      storedEntry({ campaignId: 'camp-1', emailId: 'email-1', source: 'popup', at: Date.now() });

      expect(new AttributionService().get()).toEqual({
        campaignId: 'camp-1',
        emailId: 'email-1',
        source: 'popup'
      });
    });

    it('omits optional keys entirely rather than returning them as undefined', () => {
      storedEntry({ campaignId: 'camp-1', at: Date.now() });

      const result = new AttributionService().get() as CampaignAttribution;

      expect(result).toEqual({ campaignId: 'camp-1' });
      expect('emailId' in result).toBeFalse();
      expect('source' in result).toBeFalse();
    });

    it('returns a just-inside-the-TTL attribution (29 days old)', () => {
      storedEntry({ campaignId: 'camp-1', at: Date.now() - (TTL_MS - 24 * 60 * 60 * 1000) });

      expect(new AttributionService().get()).toEqual({ campaignId: 'camp-1' });
    });

    it('expires an attribution older than 30 days AND removes the stored entry', () => {
      storedEntry({ campaignId: 'camp-1', at: Date.now() - TTL_MS - 60_000 });

      expect(new AttributionService().get()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('treats a missing `at` as epoch, i.e. expired', () => {
      storedEntry({ campaignId: 'camp-1' });

      expect(new AttributionService().get()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('rejects an entry without a campaignId and removes it', () => {
      storedEntry({ emailId: 'email-1', at: Date.now() });

      expect(new AttributionService().get()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('returns null (rather than throwing) on unparseable stored JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not json {');

      expect(new AttributionService().get()).toBeNull();
    });

    it('reflects a last-touch overwrite: only the newest stored attribution is returned', () => {
      // The constructor's capture always overwrites the whole entry; this
      // pins the read side of last-touch-wins.
      storedEntry({ campaignId: 'older', source: 'email', at: Date.now() - 1000 });
      storedEntry({ campaignId: 'newer', source: 'popup', at: Date.now() });

      expect(new AttributionService().get()).toEqual({ campaignId: 'newer', source: 'popup' });
    });
  });
});
