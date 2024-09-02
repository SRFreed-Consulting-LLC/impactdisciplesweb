import { MenuModel, MobileMenuModel } from "../models/nav-menu.model";


const menuData: MenuModel[] = [
  { link: '/', title: 'Home', hasDropdown: false },
  { link: '/events', title: 'Events', hasDropdown: false },
  { 
    link: '/about', 
    title: 'About Us', 
    hasDropdown: true, 
    dropdownItems: [
      { link: '/team', title: 'Our Team' },
      { link: '/contact', title: 'Contact' },
      { link: '/history', title: 'History' }
    ] 
  },
  { 
    link: '/resources', 
    title: 'Resources', 
    hasDropdown: true, 
    megamenu: true, 
    dropdownItems: [
      { 
        link: '/resources', 
        title: 'Training', 
        dropdownMenu: [
          { link: '/seminars', title: 'Seminars' },
          { link: '/equipping-groups', title: 'Equipping Groups' },
          { link: '/coaching-with-impact', title: 'Coaching with Impact' },
          { link: '/lunch-and-learns', title: 'Lunch and Learns' }
        ] 
      },
      { 
        link: '/resources', 
        title: 'Free Resources', 
        dropdownMenu: [
          { link: '/e-books', title: 'E-Books' },
          { link: '/podcasts', title: 'Podcasts' },
          { link: '/blog', title: 'Blog' }
        ] 
      },
      { 
        link: '/resources', 
        title: 'Get Involved', 
        dropdownMenu: [
          { link: '/give', title: 'Give' },
          { link: '/newsletter', title: 'Newsletter SignUp' },
          { link: '/prayer-team', title: 'Join the Prayer Team' }
        ] 
      },
      { 
        link: '/resources', 
        title: 'Terms of Use', 
        dropdownMenu: [
          { link: '/terms', title: 'Terms' },
          { link: '/private-policy', title: 'Private Policy' }
        ] 
      }
    ]
  },
  { link: '/shop', title: 'Shop', hasDropdown: false }
]

export default menuData;

export const mobileMenuData: MobileMenuModel[] = [
  { link: '/', title: 'Home' },
  { link: '/events', title: 'Events' },
  { 
    title: 'About Us', 
    dropdownMenu: [
      { link: '/team', title: 'Our Team' },
      { link: '/contact', title: 'Contact' },
      { link: '/history', title: 'History' }
    ] 
  },
  { 
    title: 'Resources', 
    dropdownMenu: [
      { link: '/seminars', title: 'Seminars' },
      { link: '/equipping-groups', title: 'Equipping Groups' },
      { link: '/coaching', title: 'Coaching with Impact' },
      { link: '/lunch-and-learns', title: 'Lunch and Learns' }
    ] 
  },
  { link: '/shop', title: 'Shop' }
]