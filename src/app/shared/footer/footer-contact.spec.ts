import { FooterComponent } from './footer.component';

// The footer's contact block moved onto web_config on 2026-08-30, and the
// stored shape is not the rendered shape: web_config keeps the address as
// structured fields and the phone as bare digits, while the hardcoded copy
// the footer used to render was already a formatted string.
//
// Both of these were found by comparing the LIVE site against this one -
// everything else in the footer matched and the phone came out as a run of
// ten digits. Pinned here so the next person changing this does not have to
// find it the same way.

function footer(config: unknown): FooterComponent {
  const c = new FooterComponent(
    null as never,
    { footer$: { subscribe: () => ({ unsubscribe: () => undefined }) } } as never,
    { getAll: () => Promise.resolve([]) } as never
  );
  c.config = config as never;
  return c;
}

describe('the footer contact block', () => {
  describe('the address', () => {
    it('reads as one line', () => {
      const c = footer({ address: { address1: '2564 HWY 154', city: 'Newnan', state: 'GA', zip: '30265' } });
      expect(c.addressLine).toBe('2564 HWY 154, Newnan, GA, 30265');
    });

    it('leaves out the parts that are blank, rather than showing their commas', () => {
      // address2 is an empty string on the real record, and a naive join
      // renders ", ," where a unit number would be.
      const c = footer({ address: { address1: '2564 HWY 154', address2: '', city: 'Newnan', state: 'GA', zip: '30265' } });
      expect(c.addressLine).not.toContain(', ,');
    });

    it('says nothing at all when there is no address', () => {
      expect(footer({}).addressLine).toBe('');
      expect(footer(null).addressLine).toBe('');
    });
  });

  describe('the phone number', () => {
    it('spaces out the ten digits web_config actually stores', () => {
      // This is the real stored value, and the real rendered one before the
      // move. A run of ten digits is what the comparison caught.
      expect(footer({ phone: '6788549322' }).phoneLine).toBe('+ 678 854 9322');
    });

    it('keeps a number that is already formatted looking right', () => {
      expect(footer({ phone: '+ 678 854 9322' }).phoneLine).toBe('+ 678 854 9322');
      expect(footer({ phone: '(678) 854-9322' }).phoneLine).toBe('+ 678 854 9322');
    });

    it('drops a leading country digit rather than showing eleven', () => {
      expect(footer({ phone: '16788549322' }).phoneLine).toBe('+ 678 854 9322');
    });

    it('leaves an unfamiliar shape exactly as somebody typed it', () => {
      // A guess at an international or extension format would be worse than
      // showing what is stored.
      expect(footer({ phone: '+44 20 7946 0958' }).phoneLine).toBe('+44 20 7946 0958');
      expect(footer({ phone: '' }).phoneLine).toBe('');
    });

    it('says nothing when there is no phone at all', () => {
      expect(footer({}).phoneLine).toBe('');
    });
  });

  describe('the social icons', () => {
    it('shows only what has an address, which is why LinkedIn was invisible', () => {
      // The hardcoded copy the footer used to read had no linkedIn or
      // instagram field at all, so those two icons could never render. They
      // come from web_config now, and an icon appears only when its address
      // is filled in - LinkedIn is blank on the real record, Instagram is
      // not, so Instagram starts showing and LinkedIn still does not.
      const c = footer({
        facebook: 'https://www.facebook.com/ImpactDiscipleship/',
        twitter: 'https://twitter.com/ImpactDisciples',
        youtube: 'https://youtube.com/@impactdisciples',
        linkedIn: '',
        instagram: 'https://www.instagram.com/impactdisciples/'
      });

      expect(c.config?.linkedIn).toBe('');
      expect(c.config?.instagram).toBeTruthy();
    });
  });
});
