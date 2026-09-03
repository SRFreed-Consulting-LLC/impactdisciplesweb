import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebConfigService } from 'src/app/common/services/data/web-config.service';
import { UtilsService } from 'src/app/shared/utils/services/utils.service';
import { HomeHeaderComponent } from './home-header.component';

/**
 * DOES THE HEADER EVER RENDER A BROKEN IMAGE?
 *
 * On 2026-09-02 the production site showed a broken-image icon where the
 * ministry's logo belongs. The header had read the logo from Web Config since
 * 2026-08-31; prod's config document had never been given a `logo` field, so
 * the binding resolved to '' and the template emitted `<img src="">`. The
 * component's own comment claimed that case degrades to alt text. It does
 * not - browsers draw a broken image - and nothing anywhere could tell the
 * difference, because there was no spec on this component at all.
 *
 * These assert the ONE property that matters and that no other check covers:
 * the rendered src is never empty, whatever Web Config does. They fail in
 * both directions - remove the fallback and the first goes red; break the
 * config read and the second does.
 *
 * TESTBED WITH A RENDERED TEMPLATE, against this repo's house style of
 * hand-constructing components. It is the same sanctioned exception the kit
 * renderer's spec takes: the TEMPLATE is the thing under test, and a
 * class-only spec cannot see an empty src attribute at all.
 */
describe('HomeHeaderComponent logo', () => {
  let getAll: jasmine.Spy;

  const render = async (): Promise<ComponentFixture<HomeHeaderComponent>> => {
    const fixture = TestBed.createComponent(HomeHeaderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };

  const logoSrc = (fixture: ComponentFixture<HomeHeaderComponent>): string =>
    fixture.nativeElement
      .querySelector('.header__content-logo img')
      .getAttribute('src');

  beforeEach(() => {
    getAll = jasmine.createSpy('getAll').and.returnValue(Promise.resolve([]));
    TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [HomeHeaderComponent],
      providers: [
        { provide: WebConfigService, useValue: { getAll } },
        { provide: UtilsService, useValue: { handleOpenMobileMenu: () => undefined } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  it('renders the configured logo when Web Config has one', async () => {
    getAll.and.returnValue(Promise.resolve([{ logo: 'https://example.test/logo.png' }]));
    expect(logoSrc(await render())).toBe('https://example.test/logo.png');
  });

  it('never renders an empty src when the logo field is ABSENT', async () => {
    // Exactly production's shape on 2026-09-02: a config document with every
    // other field present and no `logo` at all.
    getAll.and.returnValue(Promise.resolve([{ phone: '6788549322' }]));
    expect(logoSrc(await render())).toBe('assets/Impact-Logo_Black.png');
  });

  it('never renders an empty src when the config read FAILS', async () => {
    getAll.and.returnValue(Promise.reject(new Error('offline')));
    expect(logoSrc(await render())).toBe('assets/Impact-Logo_Black.png');
  });
});
