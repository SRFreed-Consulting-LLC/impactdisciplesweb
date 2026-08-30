export interface MenuModel {
  link?: string,
  title: string,
  hasDropdown?: boolean,
  megamenu?: boolean,
  dropdownItems?: {
    link: string
    title: string,
    dropdownMenu?: DropdownMenuModel[],
    visible: boolean | string,
    external: boolean | string,
    highlight?: boolean | string
  }[],
  visible: boolean,
  external: boolean | string,
  highlight?: boolean | string
}

// MobileMenuModel was DELETED 2026-08-29. The mobile off-canvas menu renders
// MenuModel now, the same shape the desktop header does, from the same
// Firestore document - see SiteNavigationService.
//
// Worth recording why the model itself was part of the bug rather than an
// innocent bystander: its children were DropdownMenuModel, which carries only
// link/title/visible. There was no way to mark a child as leaving the site,
// so even once Impact Merchandise was added to a mobile dropdown, the
// template's [routerLink] would have tried to route to asbshops.com inside
// the Angular app. The missing item and the inability to render it were the
// same omission.

export interface DropdownMenuModel {
  link: string;
  title: string;
  visible: boolean;
}
