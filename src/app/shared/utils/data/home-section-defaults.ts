import { HomeSectionModel } from '@impact-common/shared/models/domain/home-section.model';
import { HOME_SECTION_TYPES } from '@impact-common/shared/lists/home_section_types.enum';
import defaultServices from './home-services-data';

/**
 * What the home page has always shown, in page order.
 *
 * ONE source, read from two directions, which is the point of this file:
 *
 *  - each section component uses its slice as the default for its @Input()s,
 *    so the components that also appear on OTHER pages (subscribe-area on
 *    events and newsletter, the summit banner on events) keep working
 *    without anybody passing anything;
 *  - HomeComponent uses DEFAULT_HOME_SECTIONS as its FALLBACK when
 *    `home_sections` cannot be read.
 *
 * Before this the same copy sat in both places and would have drifted the
 * first time anyone edited one of them.
 *
 * NOTE these are the defaults, not the truth. The real content lives in
 * Firestore (see admin scripts/seed-home-sections.js, which seeded exactly
 * these values). A field staff deliberately CLEAR renders empty rather than
 * falling back here - clearing is an edit, and second-guessing it would make
 * the field impossible to empty.
 */

const STORAGE =
  'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/';

export const HOME_VIDEO_DEFAULT = {
  title: 'OUR VISION',
  subtitle:
    'Impact Discipleship Ministries exists to inspire people and churches ' +
    'to be and build disciples of Jesus Christ.',
  videoId: 'HxKSa24hF60',
  posterUrl:
    STORAGE +
    'Web-Pages%2FShared%2Fmap.jpg?alt=media&token=9db9c6f4-c852-4722-807e-5fa5d93f881a',
};

export const HOME_SUMMIT_DEFAULT = {
  title: 'DISCIPLE-MAKING SUMMIT',
  ctaTitle: 'REGISTER NOW',
  backgroundUrl:
    STORAGE +
    'Web-Pages%2FShared%2Fsummit-banner-large.PNG?alt=media&token=74f6f522-2b3e-48f0-bdb9-2b363abbe80e',
};

export const HOME_BANNER_DEFAULT = {
  title: 'DISCOVER <strong>POWERFUL</strong> DISCIPLE-MAKING RESOURCES',
  subtitle:
    'Explore our store for impactful resources crafted to guide your ' +
    'disciple-making efforts. Our collection of books is designed to ' +
    'provide practical tools and biblical insights that will deepen your ' +
    'faith and extend your impact. Start your journey today with the ' +
    'perfect resource.',
  ctaTitle: 'VISIT OUR STORE',
  ctaDestination: '/store',
  imageUrl:
    STORAGE +
    'Store%2FDMC-Series_Five-Images-1.png?alt=media&token=97f755c0-3c73-4545-979c-6428c3f2ab98',
};

export const HOME_SUBSCRIBE_DEFAULT = {
  title: 'STAY IN THE LOOP',
  subtitle:
    'Join our mailing list and receive the latest news and updates from ' +
    'our team.',
  backgroundUrl:
    STORAGE +
    'Web-Pages%2FShared%2Fnewsletter-banner.PNG?alt=media&token=928f4a44-6a3a-420b-8bf2-9aa127c1f48a',
};

/**
 * The fallback stack. Ids are the ones the seed script writes, so a
 * fallback render and a real one identify their sections the same way.
 */
export const DEFAULT_HOME_SECTIONS: HomeSectionModel[] = [
  {
    id: 'home-slider',
    type: HOME_SECTION_TYPES.SLIDER,
    order: 0,
    isActive: true,
  },
  {
    id: 'home-services',
    type: HOME_SECTION_TYPES.SERVICES,
    order: 1,
    isActive: true,
    items: defaultServices,
  },
  {
    id: 'home-summit-banner',
    type: HOME_SECTION_TYPES.SUMMIT_BANNER,
    order: 2,
    isActive: true,
    title: HOME_SUMMIT_DEFAULT.title,
    ctaTitle: HOME_SUMMIT_DEFAULT.ctaTitle,
    image: { name: 'summit-banner-large', url: HOME_SUMMIT_DEFAULT.backgroundUrl },
  },
  {
    id: 'home-video',
    type: HOME_SECTION_TYPES.VIDEO,
    order: 3,
    isActive: true,
    title: HOME_VIDEO_DEFAULT.title,
    subtitle: HOME_VIDEO_DEFAULT.subtitle,
    videoId: HOME_VIDEO_DEFAULT.videoId,
    image: { name: 'map', url: HOME_VIDEO_DEFAULT.posterUrl },
  },
  {
    id: 'home-book-banner',
    type: HOME_SECTION_TYPES.BANNER,
    order: 4,
    isActive: true,
    title: HOME_BANNER_DEFAULT.title,
    subtitle: HOME_BANNER_DEFAULT.subtitle,
    ctaTitle: HOME_BANNER_DEFAULT.ctaTitle,
    ctaDestination: HOME_BANNER_DEFAULT.ctaDestination,
    image: { name: 'DMC-Series_Five-Images-1', url: HOME_BANNER_DEFAULT.imageUrl },
  },
  {
    id: 'home-subscribe',
    type: HOME_SECTION_TYPES.SUBSCRIBE,
    order: 5,
    isActive: true,
    title: HOME_SUBSCRIBE_DEFAULT.title,
    subtitle: HOME_SUBSCRIBE_DEFAULT.subtitle,
    image: { name: 'newsletter-banner', url: HOME_SUBSCRIBE_DEFAULT.backgroundUrl },
  },
];
