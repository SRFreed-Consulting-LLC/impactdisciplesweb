import { FIREBASE_PROJECTS, functionUrl } from '@impact-common/shared/config/firebase-projects';
import { HTTP_FUNCTIONS } from '@impact-common/shared/contract/functions-contract';

export const environment = {
  production: false,
  useEmulators: false,
  firebaseConfig: FIREBASE_PROJECTS.dev,
  domain: 'http://localhost:4200',
  createPaypalOrderUrl: functionUrl('dev', HTTP_FUNCTIONS.create_paypal_order),
  capturePaypalOrderUrl: functionUrl('dev', HTTP_FUNCTIONS.capture_paypal_order),
  shippingUrl: functionUrl('dev', HTTP_FUNCTIONS.get_shipping_rates),
  youtubeVideosUrl: functionUrl('dev', HTTP_FUNCTIONS.get_youtube_videos_public),

  lookupCouponUrl: functionUrl('dev', HTTP_FUNCTIONS.lookup_coupon),


  registerForEventUrl: functionUrl('dev', HTTP_FUNCTIONS.register_for_event),


  getEventRegistrationUrl: functionUrl('dev', HTTP_FUNCTIONS.get_event_registration),


  updateMySessionsUrl: functionUrl('dev', HTTP_FUNCTIONS.update_my_sessions),


  checkRegistrationExistsUrl: functionUrl('dev', HTTP_FUNCTIONS.check_registration_exists),


  getSessionCountsUrl: functionUrl('dev', HTTP_FUNCTIONS.get_session_counts),
  subscribeUrl: functionUrl('dev', HTTP_FUNCTIONS.subscribe_to_email_list),
  campaignWebEventUrl: functionUrl('dev', HTTP_FUNCTIONS.campaign_web_event),
  newsletterArchiveUrl: functionUrl('dev', HTTP_FUNCTIONS.newsletter_archive),
  oneGiftUrl: 'https://buy.stripe.com/test_3cseVSfkM23y4tafYY',
  monthlyGiftUrl: 'https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=FES66T88VX7ZJ&source=url',
  impactPartnersGiftUrl: 'https://www.paypal.com/donate/?hosted_button_id=J5PJN3ZD8EZ4A&source=url',
  shippingCarriers: ["se-1047083"],
};
