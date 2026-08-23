import { FIREBASE_PROJECTS, functionUrl } from '@impact-common/shared/config/firebase-projects';
import { HTTP_FUNCTIONS } from '@impact-common/shared/contract/functions-contract';

export const environment = {
  production: true,
  useEmulators: false,
  firebaseConfig: FIREBASE_PROJECTS.prod,
  domain: 'https://impactdisciples.com',
  createPaypalOrderUrl: functionUrl('prod', HTTP_FUNCTIONS.create_paypal_order),
  capturePaypalOrderUrl: functionUrl('prod', HTTP_FUNCTIONS.capture_paypal_order),
  shippingUrl: functionUrl('prod', HTTP_FUNCTIONS.get_shipping_rates),
  youtubeVideosUrl: functionUrl('prod', HTTP_FUNCTIONS.get_youtube_videos_public),
  youtubePodcastsUrl: functionUrl('prod', HTTP_FUNCTIONS.get_youtube_podcasts_public),

  lookupCouponUrl: functionUrl('prod', HTTP_FUNCTIONS.lookup_coupon),


  registerForEventUrl: functionUrl('prod', HTTP_FUNCTIONS.register_for_event),


  getEventRegistrationUrl: functionUrl('prod', HTTP_FUNCTIONS.get_event_registration),


  updateMySessionsUrl: functionUrl('prod', HTTP_FUNCTIONS.update_my_sessions),


  checkRegistrationExistsUrl: functionUrl('prod', HTTP_FUNCTIONS.check_registration_exists),


  getSessionCountsUrl: functionUrl('prod', HTTP_FUNCTIONS.get_session_counts),
  subscribeUrl: functionUrl('prod', HTTP_FUNCTIONS.subscribe_to_email_list),
  campaignWebEventUrl: functionUrl('prod', HTTP_FUNCTIONS.campaign_web_event),
  newsletterArchiveUrl: functionUrl('prod', HTTP_FUNCTIONS.newsletter_archive),
  searchImpactGroupsUrl: functionUrl('prod', HTTP_FUNCTIONS.search_impact_groups),
  // Where the public Impact Group finder hands off for anything that
  // needs an account - joining a group, starting one. This site has no
  // Firebase Auth; the reader owns every group write.
  readerAppOrigin: 'https://library.impactdisciples.com',
  oneGiftUrl: 'https://buy.stripe.com/4gwcOI5sY1zq2JieUW',
  monthlyGiftUrl: 'https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=FES66T88VX7ZJ&source=url',
  impactPartnersGiftUrl: 'https://www.paypal.com/donate/?hosted_button_id=J5PJN3ZD8EZ4A&source=url',
  shippingCarriers: ["se-1047625"],
};


