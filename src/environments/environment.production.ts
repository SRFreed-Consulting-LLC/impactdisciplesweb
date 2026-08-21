import { FIREBASE_PROJECTS, functionUrl } from '@impact-common/shared/config/firebase-projects';

export const environment = {
  production: true,
  useEmulators: false,
  firebaseConfig: FIREBASE_PROJECTS.prod,
  domain: 'https://impactdisciples.com',
  createPaypalOrderUrl: functionUrl('prod', 'create_paypal_order'),
  capturePaypalOrderUrl: functionUrl('prod', 'capture_paypal_order'),
  shippingUrl: functionUrl('prod', 'get_shipping_rates'),
  youtubeVideosUrl: functionUrl('prod', 'get_youtube_videos_public'),

  lookupCouponUrl: functionUrl('prod', 'lookup_coupon'),


  registerForEventUrl: functionUrl('prod', 'register_for_event'),


  getEventRegistrationUrl: functionUrl('prod', 'get_event_registration'),


  updateMySessionsUrl: functionUrl('prod', 'update_my_sessions'),


  checkRegistrationExistsUrl: functionUrl('prod', 'check_registration_exists'),


  getSessionCountsUrl: functionUrl('prod', 'get_session_counts'),
  subscribeUrl: functionUrl('prod', 'subscribe_to_email_list'),
  campaignWebEventUrl: functionUrl('prod', 'campaign_web_event'),
  newsletterArchiveUrl: functionUrl('prod', 'newsletter_archive'),
  oneGiftUrl: 'https://buy.stripe.com/4gwcOI5sY1zq2JieUW',
  monthlyGiftUrl: 'https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=FES66T88VX7ZJ&source=url',
  impactPartnersGiftUrl: 'https://www.paypal.com/donate/?hosted_button_id=J5PJN3ZD8EZ4A&source=url',
  shippingCarriers: ["se-1047625"],
};


