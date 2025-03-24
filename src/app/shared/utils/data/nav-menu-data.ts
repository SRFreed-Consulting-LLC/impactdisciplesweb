import { MenuModel, MobileMenuModel } from "../models/nav-menu.model";


const menuData: MenuModel[] = [
  { link: '/', title: 'Home', hasDropdown: false , visible: true},
  { link: '/', title: 'Training', hasDropdown: true,
    dropdownItems: [
      { link: '/seminars', title: 'Seminars', visible: true },
      { link: '/equipping-groups', title: 'Equipping Groups', visible: true },
      { link: '/coaching-with-impact', title: 'Coaching with Impact', visible: true },
      { link: '/lunch-and-learns', title: 'Lunch and Learns', visible: true },
      { link: '/upcoming-training', title: 'Upcoming Training', visible: true }
    ], visible: true
  },
  { link: '/', title: 'Resources', hasDropdown: true,
    dropdownItems: [
      { link: '/e-books', title: 'E-Books', visible: true },
      { link: '/podcasts', title: 'Podcasts', visible: true },
      { link: '/disciple-making-minute', title: 'Disciple Making Minute', visible: true },
      { link: '/blog', title: 'Blog', visible: true }
    ], visible: true
  },
  { link: '/', title: 'Events', hasDropdown: true,
    dropdownItems: [
      { link: '/summit/2025', title: 'Summit 2026', visible: 'check' },
      { link: '/events', title: 'Upcoming Training', visible: true },
    ], visible: true
   },
  { link: '/store', title: 'Store', hasDropdown: false , visible: true},
  { link: '/give', title: 'Donate', hasDropdown: false , visible: true},
  { link: '/team', title: 'Team', hasDropdown: true,
    dropdownItems: [
      { link: '/about', title: 'About Us', visible: true },
      { link: '/contact', title: 'Contact', visible: true },
      { link: '/history', title: 'History', visible: true },
      { link: '/terms', title: 'Terms', visible: true },
      { link: '/private-policy', title: 'Private Policy', visible: true }
    ], visible: true
  },

]

export default menuData;

export const mobileMenuData: MobileMenuModel[] = [
  { link: '/', title: 'Home', visible: true },
  { link: '/events', title: 'Events', visible: true },
  {
    title: 'About Us',
    dropdownMenu: [
      { link: '/team', title: 'Our Team', visible: true },
      { link: '/contact', title: 'Contact', visible: true },
      { link: '/history', title: 'History', visible: true }
    ], visible: true
  },
  {
    title: 'Training',
    dropdownMenu: [
      { link: '/seminars', title: 'Seminars', visible: true },
      { link: '/equipping-groups', title: 'Equipping Groups', visible: true },
      { link: '/coaching-with-impact', title: 'Coaching with Impact', visible: true },
      { link: '/lunch-and-learns', title: 'Lunch and Learns', visible: true }
    ], visible: true
  },
  {
    title: 'Free Resources',
    dropdownMenu: [
      { link: '/e-books', title: 'E-Books', visible: true },
      { link: '/podcasts', title: 'Podcasts', visible: true },
      { link: '/blog', title: 'Blog', visible: true }
    ], visible: true
  },
  {
    title: 'Get Involved',
    dropdownMenu: [
      { link: '/give', title: 'Give', visible: true },
      { link: '/newsletter', title: 'Newsletter SignUp', visible: true },
      { link: '/prayer-team', title: 'Join the Prayer Team', visible: true }
    ], visible: true
  },
  {
    title: 'Terms of Use',
    dropdownMenu: [
      { link: '/terms', title: 'Terms', visible: true },
      { link: '/private-policy', title: 'Private Policy', visible: true }
    ], visible: true
  },
  { link: '/store', title: 'Shop', visible: true }
]
