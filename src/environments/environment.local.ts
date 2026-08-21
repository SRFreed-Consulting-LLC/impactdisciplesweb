import { FIREBASE_PROJECTS, functionUrl } from '@impact-common/shared/config/firebase-projects';

export const environment = {
  production: false,
  useEmulators: false,
  firebaseConfig: FIREBASE_PROJECTS.dev,
  domain: 'http://localhost:4200',
  createPaypalOrderUrl: functionUrl('dev', 'create_paypal_order'),
  capturePaypalOrderUrl: functionUrl('dev', 'capture_paypal_order'),
  shippingUrl: functionUrl('dev', 'get_shipping_rates'),
  youtubeVideosUrl: functionUrl('dev', 'get_youtube_videos_public'),

  lookupCouponUrl: functionUrl('dev', 'lookup_coupon'),


  registerForEventUrl: functionUrl('dev', 'register_for_event'),


  getEventRegistrationUrl: functionUrl('dev', 'get_event_registration'),


  updateMySessionsUrl: functionUrl('dev', 'update_my_sessions'),


  checkRegistrationExistsUrl: functionUrl('dev', 'check_registration_exists'),


  getSessionCountsUrl: functionUrl('dev', 'get_session_counts'),
  subscribeUrl: functionUrl('dev', 'subscribe_to_email_list'),
  campaignWebEventUrl: functionUrl('dev', 'campaign_web_event'),
  newsletterArchiveUrl: functionUrl('dev', 'newsletter_archive'),
  oneGiftUrl: 'https://buy.stripe.com/test_3cseVSfkM23y4tafYY',
  monthlyGiftUrl: 'https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=FES66T88VX7ZJ&source=url',
  impactPartnersGiftUrl: 'https://www.paypal.com/donate/?hosted_button_id=J5PJN3ZD8EZ4A',
  shippingCarriers: ["se-1047083"],
};


