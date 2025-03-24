export interface MenuModel {
  link: string,
  title: string,
  hasDropdown?: boolean,
  megamenu?: boolean,
  dropdownItems?: {
    link: string
    title: string,
    dropdownMenu?: DropdownMenuModel[],
    visible: boolean | string
  }[],
  visible: boolean
}

export interface MobileMenuModel{
  title: string;
  link?: string;
  dropdownMenu?: DropdownMenuModel[];
  visible: boolean;
}

export interface DropdownMenuModel {
  link: string;
  title: string;
  visible: boolean;
}
