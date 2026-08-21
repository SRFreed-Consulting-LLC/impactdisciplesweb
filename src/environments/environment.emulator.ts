import { FIREBASE_PROJECTS, functionUrl } from '@impact-common/shared/config/firebase-projects';

// Firebase EMULATOR SUITE configuration - used only by the cross-app test
// program (`npm run start-emu`; the emulator stack itself is owned and
// started from the admin repo, see its firebase.json). Every Firebase
// surface and every Cloud Function URL points at the local emulators under
// the demo-impact project id, so nothing built with this configuration can
// touch impactdisciplesdev or prod. The apiKey is fake on purpose - the
// emulators accept any non-empty key.
//
// useEmulators is consumed by app.module.ts's provideFirestore factory; it
// exists (as false) in every other environment file so this one stays
// drop-in type-compatible.


export const environment = {
  production: false,
  useEmulators: true,
  firebaseConfig: FIREBASE_PROJECTS.emulator,
  domain: 'http://localhost:4200',
  createPaypalOrderUrl: functionUrl('emulator', 'create_paypal_order'),
  capturePaypalOrderUrl: functionUrl('emulator', 'capture_paypal_order'),
  shippingUrl: functionUrl('emulator', 'get_shipping_rates'),
  youtubeVideosUrl: functionUrl('emulator', 'get_youtube_videos_public'),
  lookupCouponUrl: functionUrl('emulator', 'lookup_coupon'),
  registerForEventUrl: functionUrl('emulator', 'register_for_event'),
  getEventRegistrationUrl: functionUrl('emulator', 'get_event_registration'),
  updateMySessionsUrl: functionUrl('emulator', 'update_my_sessions'),
  checkRegistrationExistsUrl: functionUrl('emulator', 'check_registration_exists'),
  getSessionCountsUrl: functionUrl('emulator', 'get_session_counts'),
  subscribeUrl: functionUrl('emulator', 'subscribe_to_email_list'),
  campaignWebEventUrl: functionUrl('emulator', 'campaign_web_event'),
  newsletterArchiveUrl: functionUrl('emulator', 'newsletter_archive'),
  oneGiftUrl: 'https://example.test/one-gift',
  monthlyGiftUrl: 'https://example.test/monthly-gift',
  impactPartnersGiftUrl: 'https://example.test/partners-gift',
  shippingCarriers: ["se-0000000"],
};
