export const environment = {
  production: false,
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
  stripeKey: "pk_test_51IP8IBC4Pv6WfeJrdtjF5O4PsGZ4iCtIHV0QdUXya0hZZph4guaxLrR83RCiLMIkcCm5RdkuMVDCz1axYQyBfaWH00nFnZhjrl",
  stripeURL: "https://us-central1-impactdisciplesdev.cloudfunctions.net/create_payment_intent",
  stripeCancelURL: "https://us-central1-impactdisciplesdev.cloudfunctions.net/cancel_payment_intent",
  shippingUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/get_shipping_rates",
  youtubeKeyUrl: "https://us-central1-impactdisciplesdev.cloudfunctions.net/get_youtube_keys",
  oneGiftUrl: 'https://buy.stripe.com/test_3cseVSfkM23y4tafYY',
  monthlyGiftUrl: 'https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=FES66T88VX7ZJ&source=url',
  application: "web"
};


