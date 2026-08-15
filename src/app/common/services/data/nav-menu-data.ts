import { MenuModel, MobileMenuModel } from "src/app/common/models/utils/nav-menu.model";

// Primary navigation.
//
// Restructured as part of the redesign. The previous version carried eight
// top-level entries, two of which ("Summit 2027", "Impact Golf Tournament")
// were flagged `highlight: true` and rendered in bright blue -- so the two
// loudest items in the bar both took the visitor off the site, and the golf
// tournament outranked Team and Give. Both now sit inside the Events group and
// are marked as leaving the site with an arrow glyph rather than with colour.
//
// Seven top-level entries, each a real destination or a real group.

const menuData: MenuModel[] = [
  {
    link: '/', title: 'Home', hasDropdown: false, visible: true, external: false
  },
  {
    title: 'Training',
    hasDropdown: true,
    dropdownItems: [
      { link: '/seminars', title: 'Seminars', visible: true, external: false },
      { link: '/equipping-groups', title: 'Equipping Groups', visible: true, external: false },
      { link: '/coaching-with-impact', title: 'Coaching with Impact', visible: true, external: false },
      { link: '/lunch-and-learns', title: 'Lunch and Learns', visible: true, external: false }
    ],
    visible: true,
    external: false
  },
  {
    title: 'Events',
    link: '/events',
    hasDropdown: true,
    dropdownItems: [
      { link: '/events', title: 'All Upcoming Events', visible: true, external: false },
      { link: '/summit/2027', title: 'Disciple-Making Summit', visible: true, external: false },
      {
        link: 'https://events.golfstatus.com/event/2nd-Annual-Impact-Golf-Tournament',
        title: 'Impact Golf Tournament',
        visible: true,
        external: true
      }
    ],
    visible: true,
    external: false
  },
  {
    title: 'Resources',
    hasDropdown: true,
    dropdownItems: [
      { link: '/e-books', title: 'E-Books', visible: true, external: false },
      { link: '/podcasts', title: 'Podcasts', visible: true, external: false },
      { link: '/disciple-making-minute', title: 'Disciple-Making Minute', visible: true, external: false },
      { link: '/monthly-newsletter', title: 'Monthly Newsletter', visible: true, external: false },
      { link: '/store?category=spanish-resources', title: 'Spanish Resources', visible: true, external: false }
    ],
    visible: true,
    external: false
  },
  {
    title: 'Store',
    link: '/store',
    hasDropdown: true,
    dropdownItems: [
      { link: '/store', title: 'Impact Books', visible: true, external: false },
      { link: '/e-books', title: 'Free E-Books', visible: true, external: false },
      {
        link: 'http://www.asbshops.com/lagrangehub/matthewfrady/impact',
        title: 'Impact Merchandise',
        visible: true,
        external: true
      }
    ],
    visible: true,
    external: false
  },
  { link: '/team', title: 'Team', hasDropdown: false, visible: true, external: false },
  { link: '/give', title: 'Give', hasDropdown: false, visible: true, external: false }
];

export default menuData;

// The drawer mirrors the same IA. It is a separate array because the drawer
// renders groups as native <details> disclosures rather than hover submenus.
export const mobileMenuData: MobileMenuModel[] = [
  { link: '/', title: 'Home', visible: true },
  {
    title: 'Training',
    dropdownMenu: [
      { link: '/seminars', title: 'Seminars', visible: true },
      { link: '/equipping-groups', title: 'Equipping Groups', visible: true },
      { link: '/coaching-with-impact', title: 'Coaching with Impact', visible: true },
      { link: '/lunch-and-learns', title: 'Lunch and Learns', visible: true }
    ],
    visible: true
  },
  {
    title: 'Events',
    dropdownMenu: [
      { link: '/events', title: 'All Upcoming Events', visible: true },
      { link: '/summit/2027', title: 'Disciple-Making Summit', visible: true }
    ],
    visible: true
  },
  {
    title: 'Resources',
    dropdownMenu: [
      { link: '/e-books', title: 'E-Books', visible: true },
      { link: '/podcasts', title: 'Podcasts', visible: true },
      { link: '/disciple-making-minute', title: 'Disciple-Making Minute', visible: true },
      { link: '/monthly-newsletter', title: 'Monthly Newsletter', visible: true },
      { link: '/store?category=spanish-resources', title: 'Spanish Resources', visible: true }
    ],
    visible: true
  },
  { link: '/store', title: 'Store', visible: true },
  { link: '/team', title: 'Team', visible: true },
  { link: '/give', title: 'Give', visible: true },
  {
    link: 'https://events.golfstatus.com/event/2nd-Annual-Impact-Golf-Tournament',
    title: 'Impact Golf Tournament',
    external: true,
    visible: true
  }
];
