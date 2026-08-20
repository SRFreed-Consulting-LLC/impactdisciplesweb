export const environment = {
  production: false,
  useEmulators: false,
  firebaseConfig: {
    apiKey: "AIzaSyDuxbnrsCjpHqlNauBWsaSrQHChUN-w008",
    authDomain: "impactdisciplesdev.firebaseapp.com",
    projectId: "impactdisciplesdev",
    storageBucket: "impactdisciplesdev.appspot.com",
    messagingSenderId: "989008672868",
    appId: "1:989008672868:web:d2ee543e60c5e927260771",
    measurementId: "G-1EEHPL0SRD"
  },
  domain: 'http://localhost:4200',
  session_expires: 30,
  freeEbookUrl: "https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/EBooks%2FM-7-Journal.pdf?alt=media&token=50e3282f-6fa1-46aa-ad3a-a486e4024af1",
  createPaypalOrderUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/create_paypal_order",
  capturePaypalOrderUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/capture_paypal_order",
  shippingUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/get_shipping_rates",
  youtubeVideosUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/get_youtube_videos_public",

  lookupCouponUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/lookup_coupon",


  registerForEventUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/register_for_event",


  getEventRegistrationUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/get_event_registration",


  updateMySessionsUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/update_my_sessions",


  checkRegistrationExistsUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/check_registration_exists",


  getSessionCountsUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/get_session_counts",
  subscribeUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/subscribe_to_email_list",
  campaignWebEventUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/campaign_web_event",
  newsletterArchiveUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/newsletter_archive",
  unsubscribeUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/unsubscribe_from_email_list",
  oneGiftUrl: 'https://buy.stripe.com/test_3cseVSfkM23y4tafYY',
  monthlyGiftUrl: 'https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=FES66T88VX7ZJ&source=url',
  impactPartnersGiftUrl: 'https://www.paypal.com/donate/?hosted_button_id=J5PJN3ZD8EZ4A',
  shippingCarriers: ["se-1047083"],
  application: "web"
};


