import { HomeServicesModel } from "../models/home-services.model";


const services: HomeServicesModel[] = [
  {
    id: 0,
    img: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2Fservice-coaching-and-consulting.PNG?alt=media&token=e49ea402-a6c0-441c-8a75-f443aa5c207f',
    title: "COACHING AND CONSULTING",
    description: "Consider our consulting and coaching services",
    link: '/equipping-groups'
  },
  {
    id: 1,
    img: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2Fservice-seminars.PNG?alt=media&token=ec3a4fd3-5364-40b7-82d4-42898a5c2d81',
    title: "SEMINARS",
    description: "Host a Disciple Making Church seminar for your ministry",
    link: '/seminars'
  },
  {
    id: 2,
    img: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2Fservice-consultation.PNG?alt=media&token=ad3369ad-87ee-495c-8579-a04551bd6939',
    title: "CONSULTATION",
    description: "Schedule your first consultation on us",
    link: '/consultation-survey'
  },
  {
    id: 3,
    img: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2Fservice-support-our-mission.PNG?alt=media&token=4f49643b-4193-4940-9bd7-d0c8360245c7',
    title: "SUPPORT OUR MISSION",
    description: "Partner with us by praying and giving",
    link: '/give'
  },
  {
    id: 4,
    img: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2Fservice-connect-with-us.PNG?alt=media&token=be61d4b9-6349-4022-bd0e-6f1d0603025f',
    title: "CONNECT WITH US",
    description: "Let us know how we can support your ministry",
    link: '/contact'
  }
]

export default services;