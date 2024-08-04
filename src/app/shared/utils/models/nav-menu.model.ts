export interface MenuModel {
  link: string,
  title: string,
  hasDropdown?: boolean,
  megamenu?: boolean,
  dropdownItems?: {
    link: string
    title: string,
    dropdownMenu?: DropdownMenuModel[]
  }[],
}

export interface MobileMenuModel{
  title: string;
  link?: string;
  dropdownMenu?: DropdownMenuModel[];
}

export interface DropdownMenuModel {
  link: string;
  title: string;
}
