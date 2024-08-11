import { Component,Input } from '@angular/core';
import Swiper from 'swiper';

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent {

  testimonial_data = [
    { name: 'Rod Zwemke', shortDesc: 'Ready to Leverage My Influence', longDesc: 'As a result of this equipping group, I am ready to leverage my influence in groups, in our church, and in other churches to make disciples that make disciples. I am leading a group of potential leaders through the M-7 Project. I am leading myself from an annual plan and using a monthly check-up for accountability. I am planning a 3:15 equipping group to train small group leaders later this year. I am investing in other pastors to help them become disciple-making pastors.' },
    { name: 'Bert Chastain', shortDesc: 'I Plan to Lead Myself and Others', longDesc: 'I am planning to use what I learned to leverage my own leadership and influence. I plan to promote this equipping group and also to lead myself well and to lead others by staying focus on the mission of Jesus. This group was a great equipping experience for pastors and would also be good for lay leaders to understand and stay focused on the mission of Christ.' },
    { name: 'Gail Haney', shortDesc: 'So Grateful', longDesc: 'Thank you so much for all you did to allow us to host your Disciple Making Church Seminar  last weekend. We have received great feedback from our leaders! Our church was all abuzz on Sunday as our leaders shared their excitement of what they had heard on Saturday with others in the church. I heard a few leaders even say they felt they had been to a revival! I think the hearts of so many of our people needed this message and their hearts and minds were awakened to the importance of making disciples. For that I am so grateful!' }
  ];

  ngOnInit (){
    new Swiper(".testimonial__slider-active", {
      slidesPerView: 1,
      spaceBetween: 0,
      pagination:{
        clickable:true,
        el:'.tp-testi-dot'
      }
    });
  }

}