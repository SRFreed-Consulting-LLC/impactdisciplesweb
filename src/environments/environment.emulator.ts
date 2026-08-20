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

const FN = "http://127.0.0.1:5001/demo-impact/us-central1";

export const environment = {
  production: false,
  useEmulators: true,
  firebaseConfig: {
    apiKey: "demo-api-key",
    authDomain: "demo-impact.firebaseapp.com",
    projectId: "demo-impact",
    storageBucket: "demo-impact.appspot.com",
    messagingSenderId: "0",
    appId: "1:0:web:demo",
  },
  domain: 'http://localhost:4200',
  session_expires: 30,
  stripeKey: "pk_test_fake_emulator",
  freeEbookUrl: "https://example.test/free-ebook.pdf",
  stripeURL: `${FN}/create_payment_intent`,
  stripeCancelURL: `${FN}/cancel_payment_intent`,
  createPaypalOrderUrl: `${FN}/create_paypal_order`,
  capturePaypalOrderUrl: `${FN}/capture_paypal_order`,
  shippingUrl: `${FN}/get_shipping_rates`,
  youtubeVideosUrl: `${FN}/get_youtube_videos_public`,
  lookupCouponUrl: `${FN}/lookup_coupon`,
  registerForEventUrl: `${FN}/register_for_event`,
  getEventRegistrationUrl: `${FN}/get_event_registration`,
  updateMySessionsUrl: `${FN}/update_my_sessions`,
  checkRegistrationExistsUrl: `${FN}/check_registration_exists`,
  getSessionCountsUrl: `${FN}/get_session_counts`,
  subscribeUrl: `${FN}/subscribe_to_email_list`,
  campaignWebEventUrl: `${FN}/campaign_web_event`,
  newsletterArchiveUrl: `${FN}/newsletter_archive`,
  unsubscribeUrl: `${FN}/unsubscribe_from_email_list`,
  oneGiftUrl: 'https://example.test/one-gift',
  monthlyGiftUrl: 'https://example.test/monthly-gift',
  impactPartnersGiftUrl: 'https://example.test/partners-gift',
  shippingCarriers: ["se-0000000"],
  application: "web"
};
