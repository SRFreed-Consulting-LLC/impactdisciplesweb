import { PageContentBlock, PageContentModel } from '@impact-common/shared/models/domain/page-content.model';

/**
 * Turning a page_content document into what a dispatcher page draws.
 *
 * Every wired public page is a dispatcher now: it loops over an ordered list
 * of typed sections and hands each one to its page's section component. Two
 * rules are shared by all of them and live here rather than in eleven
 * templates, because getting either one different on one page is exactly the
 * bug nobody would notice.
 */

/** What a template needs: the live sections, and each one's position among
 *  sections of its own type. */
export interface PageView {
  sections: PageContentBlock[];
  typeIndex: Record<string, number>;
}

/**
 * The sections a visitor actually sees, in order, with their type positions.
 *
 * SWITCHED-OFF SECTIONS ARE DROPPED FIRST, before anything is counted. The
 * positions feed layout rules that alternate - which side a story column's
 * picture sits on, which side a feature row's screenshot sits on - so
 * counting a hidden section would leave two pictures stacked together the
 * moment staff switched one off.
 *
 * `includeHidden` is Page Manager's previewer and ONLY that: the preview
 * shows the page being BUILT, so switched-off sections draw too (marked by
 * the template) and are counted for alternation - the builder is looking at
 * the page as it will be, not at today's visitor view. A visitor's page
 * never passes true.
 */
export function buildPageView(
  doc: { blocks?: PageContentBlock[] } | null,
  includeHidden = false
): PageView {
  const sections = (doc?.blocks ?? []).filter((b) => includeHidden || b.isActive !== false);

  const seen = new Map<string, number>();
  const typeIndex: Record<string, number> = {};
  for (const block of sections) {
    const type = block.type ?? '';
    const n = seen.get(type) ?? 0;
    typeIndex[block.key] = n;
    seen.set(type, n + 1);
  }
  return { sections, typeIndex };
}

/** The same, for a page with no alternating layout to index. */
export function liveSections(doc: PageContentModel | null): PageContentBlock[] {
  return (doc?.blocks ?? []).filter((b) => b.isActive !== false);
}

/**
 * KIT PAGES ONLY: the live sections grouped into rows, honouring
 * `pairWithNext` - a section that shares its row takes the next one in
 * beside it (Contact's two parallel halves). A pair with nothing after it
 * quietly stacks; the twelve originals never call this.
 */
export function pairKitRows(sections: PageContentBlock[]): PageContentBlock[][] {
  const rows: PageContentBlock[][] = [];
  let i = 0;
  while (i < sections.length) {
    if (sections[i].pairWithNext && i + 1 < sections.length) {
      rows.push([sections[i], sections[i + 1]]);
      i += 2;
    } else {
      rows.push([sections[i]]);
      i += 1;
    }
  }
  return rows;
}
