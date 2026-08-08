export interface IMenuType {
  link?: string,
  title: string,
  hasDropdown?: boolean,
  megamenu?: boolean,
  dropdownItems?: {
    link?: string
    title: string,
    dropdownMenu?: {
      link: string
      title: string,
    }[]
  }[],
}
