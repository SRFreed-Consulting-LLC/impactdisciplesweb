import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import Swiper from 'swiper';
import { EffectFade, Pagination } from 'swiper/modules';

@Component({
  selector: 'app-home-header-slider',
  templateUrl: './home-header-slider.component.html',
  styleUrls: ['./home-header-slider.component.scss']
})
export class HomeHeaderSliderComponent implements AfterViewInit, OnInit {
  @ViewChild('heroSliderContainer') heroSliderContainer: ElementRef;


  public images: any[] = [
    {
      url: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2F20240126-AS3A2182.jpg?alt=media&token=770452ad-6630-4447-bf79-3b8ba942c9ac',
      title: 'Disciple-Making Summit',
      text: 'Join us at the Disciple-Making Summit and come together in community with hundreds of other disciple-makers to learn what it means to leave a legacy that lasts through multiplying disciples.',
      side: 'r'
    },{
      url: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2F20220417-AU3A5935.jpg?alt=media&token=1c156406-cd74-4647-923b-368e5771f28a',
      title: 'Impact Discipleship Ministries',
      text: 'We exist to inspire people and churches to be and build disciples of Jesus Christ.',
      side: 'r'
    },{
      url: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2F20210129-IMG_0099.jpg?alt=media&token=d65d4bcb-dee3-488b-be5e-ac76a299f46f',
      title: 'Disciple-Making Summit',
      text: 'Join us at the Disciple-Making Summit and come together in community with hundreds of other disciple-makers to learn what it means to leave a legacy that lasts through multiplying disciples.',
      side: 'l'
    },{
      url: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2Fhome-header-2.PNG?alt=media&token=9f2866c3-5b8c-4cdc-9604-573c276fd7f9',
      title: 'Impact Discipleship Ministries',
      text: 'We exist to inspire people and churches to be and build disciples of Jesus Christ.',
      side: 'l'
    },{
      url: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2F20210129-IMG_0111.jpg?alt=media&token=31edceca-93da-4597-a9c6-fc777d00d4ad',
      title: 'Disciple-Making Summit',
      text: 'Join us at the Disciple-Making Summit and come together in community with hundreds of other disciple-makers to learn what it means to leave a legacy that lasts through multiplying disciples.',
      side: 'r'
    },{
      url: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2Fhome-header.jpg?alt=media&token=4a6de836-e6fc-4c12-9e2a-e8c063ffdcc3',
      title: 'Impact Discipleship Ministries',
      text: 'We exist to inspire people and churches to be and build disciples of Jesus Christ.',
      side: 'l'
    },{
      url: 'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o/Web-Pages%2FHome%2F20240126-AS3A2169.jpg?alt=media&token=ea296bfc-16a7-41a2-8d0c-09fde70f8525',
      title: 'Disciple-Making Summit',
      text: 'Join us at the Disciple-Making Summit and come together in community with hundreds of other disciple-makers to learn what it means to leave a legacy that lasts through multiplying disciples.',
      side: 'r'
    }
  ]

  public swiperInstance: Swiper | undefined;

  constructor(private cdr: ChangeDetectorRef){
    console.log('Constructor triggered');
  }

  ngOnInit(): void {
    console.log('ngoninit')
    this.cdr.detectChanges();

      this.swiperInstance = new Swiper(this.heroSliderContainer.nativeElement, {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        effect : 'fade',
        modules:[Pagination,EffectFade],
        pagination: {
          clickable: true,
          el:'.tp-slider-dot-2'
        },
        autoplay: {
          delay: 5000,
          disableOnInteraction: false
        }
      })
    console.log(this.swiperInstance)
  }

  ngAfterViewInit() {
    console.log('ngafter')
    // this.cdr.detectChanges();

    //   this.swiperInstance = new Swiper(this.heroSliderContainer.nativeElement, {
    //     slidesPerView: 1,
    //     spaceBetween: 0,
    //     loop: true,
    //     effect : 'fade',
    //     modules:[Pagination,EffectFade],
    //     pagination: {
    //       clickable: true,
    //       el:'.tp-slider-dot-2'
    //     },
    //     autoplay: {
    //       delay: 5000,
    //       disableOnInteraction: false
    //     }
    //   })
    // console.log(this.swiperInstance)
  }

  pauseAutoplay() {
    if (this.swiperInstance && this.swiperInstance.autoplay) {
      this.swiperInstance.autoplay.stop();
    }
  }

  resumeAutoplay() {
    if (this.swiperInstance && this.swiperInstance.autoplay) {
      this.swiperInstance.autoplay.start();
    }
  }
}
