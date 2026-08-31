import { PageContentBlock } from '@impact-common/shared/models/domain/page-content.model';
import { PAGE_SECTION_TYPES } from '@impact-common/shared/lists/page_section_types.enum';
import { buildPageView, liveSections } from './page-sections';

// Every wired public page reads its sections through these two functions, so
// a rule that is wrong here is wrong on eleven pages at once. The alternating
// index in particular is the kind of thing that looks right until someone
// switches a section off.
const block = (key: string, type: PAGE_SECTION_TYPES, isActive?: boolean): PageContentBlock =>
  ({ key, type, ...(isActive === undefined ? {} : { isActive }) });

describe('buildPageView', () => {
  it('keeps the stored order', () => {
    const view = buildPageView({
      blocks: [
        block('c', PAGE_SECTION_TYPES.COUNTRIES),
        block('a', PAGE_SECTION_TYPES.STORY),
        block('b', PAGE_SECTION_TYPES.BANNER)
      ]
    });

    expect(view.sections.map((s) => s.key)).toEqual(['c', 'a', 'b']);
  });

  it('leaves switched-off sections out', () => {
    const view = buildPageView({
      blocks: [
        block('a', PAGE_SECTION_TYPES.STORY, true),
        block('b', PAGE_SECTION_TYPES.STORY, false),
        block('c', PAGE_SECTION_TYPES.STORY)
      ]
    });

    // A block with no isActive at all is showing: that is what an older
    // document looks like, and a page must not blank itself over it.
    expect(view.sections.map((s) => s.key)).toEqual(['a', 'c']);
  });

  it('keeps switched-off sections FOR THE PREVIEWER, and counts them', () => {
    // The preview shows the page being BUILT (owner decision 2026-08-31):
    // a new page's sections all start switched off, and a previewer that
    // dropped them would show someone the absence of their work. They are
    // counted for alternation too - the builder is looking at the page as
    // it will be, not at today's visitor view.
    const view = buildPageView({
      blocks: [
        block('a', PAGE_SECTION_TYPES.STORY, true),
        block('b', PAGE_SECTION_TYPES.STORY, false),
        block('c', PAGE_SECTION_TYPES.STORY)
      ]
    }, true);

    expect(view.sections.map((s) => s.key)).toEqual(['a', 'b', 'c']);
    expect(view.typeIndex['c']).toBe(2);
  });

  it('indexes each section among sections OF ITS OWN TYPE', () => {
    // Not position in the stack. The story columns alternate which side their
    // picture sits on, and they have to keep alternating with each other
    // however many banners are dragged in between - counting global position
    // would break the pattern the moment anything non-story moved in.
    const view = buildPageView({
      blocks: [
        block('s1', PAGE_SECTION_TYPES.STORY),
        block('banner', PAGE_SECTION_TYPES.BANNER),
        block('s2', PAGE_SECTION_TYPES.STORY),
        block('s3', PAGE_SECTION_TYPES.STORY)
      ]
    });

    expect(view.typeIndex['s1']).toBe(0);
    expect(view.typeIndex['s2']).toBe(1);
    expect(view.typeIndex['s3']).toBe(2);
    expect(view.typeIndex['banner']).toBe(0);
  });

  it('counts only what a visitor sees, so hiding one does not stack two', () => {
    // THE reason the filter runs before the count. With s2 switched off, s3
    // becomes the second visible story and must flip - counting the hidden
    // one would leave s1 and s3 with their pictures on the same side.
    const view = buildPageView({
      blocks: [
        block('s1', PAGE_SECTION_TYPES.STORY),
        block('s2', PAGE_SECTION_TYPES.STORY, false),
        block('s3', PAGE_SECTION_TYPES.STORY)
      ]
    });

    expect(view.typeIndex['s3']).toBe(1);
  });

  it('renders nothing rather than throwing when there is no document', () => {
    // These documents are the only copy of a page's text, so an unreadable
    // read is an empty page - but it must not be a broken one.
    expect(buildPageView(null).sections).toEqual([]);
    expect(buildPageView({}).sections).toEqual([]);
    expect(buildPageView({ blocks: [] }).typeIndex).toEqual({});
  });
});

describe('liveSections', () => {
  it('applies the same on/off rule, without the indexing', () => {
    const sections = liveSections({
      blocks: [
        block('a', PAGE_SECTION_TYPES.PROSE, true),
        block('b', PAGE_SECTION_TYPES.PROSE, false)
      ]
    } as never);

    expect(sections.map((s) => s.key)).toEqual(['a']);
  });

  it('is empty for a document that could not be read', () => {
    expect(liveSections(null)).toEqual([]);
  });
});
