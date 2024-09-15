import { HomeHeaderSlider } from "../models/home-header-slider.model";

//Add more items to activate header slider functionality
const homeHeaderSlider: HomeHeaderSlider[] = [
  {
    id: 0,
    bgImg: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Disciple-Making-Summit%2Fworship-1.jpg?alt=media&token=3424f393-ea9d-4bd3-b642-fb7d8efb4555',
    isDark: true,
    title: 'Impact Discipleship Ministries',
    subtitle: 'We exist to inspire people and churches to be and build disciples of Jesus Christ.',
    buttonLink: '/events',
    buttonText: 'REGISTER FOR EVENT'
  },
  {
    id: 1,
    bgImg: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Disciple-Making-Summit%2Fdisciple-making-header.PNG?alt=media&token=5d5ba77b-0ec0-47cb-a370-c78bb8317cc3',
    isDark: true,
    title: 'Disciple-Making Summit',
    subtitle: 'Join us at the Disciple-Making Summit and come together in community with hundreds of other disciple-makers to learn what it means to leave a legacy that lasts through multiplying disciples.',
    buttonLink: '/events',
    buttonText: 'REGISTER FOR EVENT'
  }
]; 

export default homeHeaderSlider;
