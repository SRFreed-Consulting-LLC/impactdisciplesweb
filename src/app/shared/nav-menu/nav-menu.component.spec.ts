import { of } from 'rxjs';
import { NavMenuComponent } from './nav-menu.component';

// The site menu is on every page, and the thing being pinned here is the one
// that was broken for its whole life: a dropdown LABEL is a control, not a
// link, and it has to be operable without a mouse. See _header.scss's
// :focus-within rule for the other half - what is visible is CSS's job.
describe('NavMenuComponent', () => {
  const build = (): NavMenuComponent =>
    new NavMenuComponent({ navigateByUrl: () => undefined } as never, { menuItems$: of([]) } as never);

  describe('telling a label from a destination', () => {
    it('treats an entry with children and no address as a label', () => {
      // "Training" opens six links and goes nowhere itself.
      expect(build().isMenuLabel({ hasDropdown: true, link: '' } as never)).toBeTrue();
      expect(build().isMenuLabel({ hasDropdown: true, link: undefined } as never)).toBeTrue();
    });

    it('leaves an entry that has BOTH children and an address a plain link', () => {
      // Donate goes to /give and also drops down; making it a button would
      // take away a working link.
      expect(build().isMenuLabel({ hasDropdown: true, link: '/give' } as never)).toBeFalse();
    });

    it('leaves an ordinary link alone', () => {
      expect(build().isMenuLabel({ hasDropdown: false, link: '/team' } as never)).toBeFalse();
    });
  });

  describe('what a screen reader is told', () => {
    it('reports the item focus is inside as expanded', () => {
      const c = build();
      c.openIndex = 2;

      expect(c.isOpen(2)).toBeTrue();
      expect(c.isOpen(1)).toBeFalse();
    });

    it('does NOT claim expanded after Escape, when focus is still on the label', () => {
      // The one state where a screen-reader user cannot check for themselves:
      // focus sits on the label and the list is closed. Saying "expanded"
      // there is telling them the opposite of the truth.
      const c = build();
      c.openIndex = 2;
      c.dismissedIndex = 2;

      expect(c.isOpen(2)).toBeFalse();
    });

    it('stays open while focus moves BETWEEN the item\'s own links', () => {
      // focusout fires on every hop inside the submenu. Closing on those
      // would collapse the menu the moment someone tabbed into it - the
      // failure this guards.
      const c = build();
      c.openIndex = 1;
      const child = document.createElement('a');
      const row = document.createElement('li');
      row.appendChild(child);

      c.onLeave({ currentTarget: row, relatedTarget: child } as never, 1);

      expect(c.openIndex).toBe(1);
    });

    it('closes once focus leaves the item altogether', () => {
      const c = build();
      c.openIndex = 1;
      const row = document.createElement('li');

      c.onLeave({ currentTarget: row, relatedTarget: document.createElement('a') } as never, 1);

      expect(c.openIndex).toBeNull();
    });

    it('does not close a DIFFERENT item than the one being left', () => {
      const c = build();
      c.openIndex = 3;

      c.onLeave({ currentTarget: document.createElement('li'), relatedTarget: null } as never, 1);

      expect(c.openIndex).toBe(3);
    });
  });

  describe('operating it from the keyboard', () => {
    it('moves focus into the list on Enter, and stops the page scrolling', () => {
      const c = build();
      const row = document.createElement('li');
      const sub = document.createElement('ul');
      sub.className = 'submenu';
      const first = document.createElement('a');
      first.href = '/seminars';
      sub.appendChild(first);
      row.appendChild(sub);
      document.body.appendChild(row);
      let prevented = false;

      c.enterMenu({ preventDefault: () => { prevented = true; } } as never, row);

      expect(prevented).withContext('Space would scroll the page').toBeTrue();
      expect(document.activeElement).toBe(first);
      row.remove();
    });

    it('does not throw on a label whose list is empty', () => {
      const c = build();
      expect(() => c.enterMenu({ preventDefault: () => undefined } as never, document.createElement('li')))
        .not.toThrow();
    });

    it('closes on Escape and puts focus back on the label', () => {
      // Escape is bound on the whole ITEM, because it is pressed from inside
      // the list - a handler on the label alone never fires from there, and
      // that is the version that shipped first.
      const c = build();
      const row = document.createElement('li');
      const label = document.createElement('a');
      label.href = '#';
      const sub = document.createElement('ul');
      sub.className = 'submenu';
      sub.appendChild(document.createElement('a'));
      row.append(label, sub);
      document.body.appendChild(row);

      c.closeMenu({ stopPropagation: () => undefined } as never, row, 2);

      expect(c.dismissedIndex).withContext('the flag is what beats :focus-within').toBe(2);
      expect(document.activeElement)
        .withContext('dumping focus at the top of the page is not "closing"').toBe(label);
      row.remove();
    });

    it('lets the list open again once focus leaves the item', () => {
      const c = build();
      c.dismissedIndex = 2;

      c.onLeave({ currentTarget: document.createElement('li'), relatedTarget: null } as never, 2);

      expect(c.dismissedIndex).toBeNull();
    });
  });
});
