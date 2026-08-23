import { FIREBASE_PROJECTS, functionUrl } from '@impact-common/shared/config/firebase-projects';
import { HTTP_FUNCTIONS } from '@impact-common/shared/contract/functions-contract';

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
  createPaypalOrderUrl: functionUrl('emulator', HTTP_FUNCTIONS.create_paypal_order),
  capturePaypalOrderUrl: functionUrl('emulator', HTTP_FUNCTIONS.capture_paypal_order),
  shippingUrl: functionUrl('emulator', HTTP_FUNCTIONS.get_shipping_rates),
  youtubeVideosUrl: functionUrl('emulator', HTTP_FUNCTIONS.get_youtube_videos_public),
  youtubePodcastsUrl: functionUrl('emulator', HTTP_FUNCTIONS.get_youtube_podcasts_public),
  lookupCouponUrl: functionUrl('emulator', HTTP_FUNCTIONS.lookup_coupon),
  registerForEventUrl: functionUrl('emulator', HTTP_FUNCTIONS.register_for_event),
  getEventRegistrationUrl: functionUrl('emulator', HTTP_FUNCTIONS.get_event_registration),
  updateMySessionsUrl: functionUrl('emulator', HTTP_FUNCTIONS.update_my_sessions),
  checkRegistrationExistsUrl: functionUrl('emulator', HTTP_FUNCTIONS.check_registration_exists),
  getSessionCountsUrl: functionUrl('emulator', HTTP_FUNCTIONS.get_session_counts),
  subscribeUrl: functionUrl('emulator', HTTP_FUNCTIONS.subscribe_to_email_list),
  campaignWebEventUrl: functionUrl('emulator', HTTP_FUNCTIONS.campaign_web_event),
  newsletterArchiveUrl: functionUrl('emulator', HTTP_FUNCTIONS.newsletter_archive),
  searchImpactGroupsUrl: functionUrl('emulator', HTTP_FUNCTIONS.search_impact_groups),
  // Where the public Impact Group finder hands off for anything that
  // needs an account - joining a group, starting one. This site has no
  // Firebase Auth; the reader owns every group write.
  readerAppOrigin: 'http://localhost:4300',
  oneGiftUrl: 'https://example.test/one-gift',
  monthlyGiftUrl: 'https://example.test/monthly-gift',
  impactPartnersGiftUrl: 'https://example.test/partners-gift',
  shippingCarriers: ["se-0000000"],
};
