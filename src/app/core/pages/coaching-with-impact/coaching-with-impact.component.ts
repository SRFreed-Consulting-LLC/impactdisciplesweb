import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import Swiper from 'swiper';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

export interface CoachTestimonial {
  quote: string[];
  name: string;
  role: string;
}

/**
 * Coaching With Impact.
 *
 * Rebuilt 2026-08-23 from a verbatim WordPress/Divi export: the previous
 * template was a whole HTML document - `<!DOCTYPE html>`, `<head>`, an
 * xmlrpc pingback - nested inside this Angular component, pulling 54
 * `<script>` and 32 `<link>` tags off the WordPress site (jQuery,
 * WooCommerce, Divi motion effects, an exit-intent popup, Stripe and a
 * Facebook tracking pixel) behind 2,608 lines of markup and 5,462 lines of
 * SCSS. None of it was reachable behaviour in an SPA; all of it shipped to
 * every visitor of this page.
 *
 * The content, the copy and every image are the same - all of the imagery
 * already lived in this project's own Firebase Storage, so nothing here
 * depends on the WordPress site staying up. The page is now built from the
 * same pieces as the rest of the site: `app-home-header`, `app-header`,
 * `.impact-btn`, the theme's type scale and palette, `youtube-player` for
 * the video and Swiper for the testimonials.
 */
@Component({
    selector: 'app-coaching-with-impact',
    templateUrl: './coaching-with-impact.component.html',
    styleUrls: ['./coaching-with-impact.component.scss'],
    standalone: false
})
export class CoachingWithImpactComponent implements AfterViewInit, OnDestroy {
  isPlaying = false;

  private swiper: Swiper | undefined;

  // Storage paths, kept as named constants so a re-upload is a one-line
  // change rather than a hunt through the template.
  private static readonly BUCKET =
    'https://firebasestorage.googleapis.com/v0/b/impactdisciples-a82a8.appspot.com/o';

  readonly heroImage =
    `${CoachingWithImpactComponent.BUCKET}/Coaching-With-Impact%2FUntitled-design-1.png?alt=media&token=9a0407b8-074e-4cac-b3e9-c5ab1e1ced18`;
  readonly gridBackground =
    `${CoachingWithImpactComponent.BUCKET}/Coaching-With-Impact%2Fgrid-bg-1.png?alt=media&token=cd20c7ce-deaa-471b-aa05-5a2aee9e2b90`;
  readonly coachingBookImage =
    `${CoachingWithImpactComponent.BUCKET}/Coaching-With-Impact%2FEbook-1-scaled.jpg?alt=media&token=453408af-2bc9-40ac-aaeb-482c97b18f8f`;
  readonly competingBookImage =
    `${CoachingWithImpactComponent.BUCKET}/Store%2FCompeting%20With%20Impact.png?alt=media&token=58b815ef-1c81-4f1a-9a24-92149ede5182`;
  readonly echsGroupImage =
    `${CoachingWithImpactComponent.BUCKET}/Coaching-With-Impact%2FIMG_1707.JPG?alt=media&token=3f98f870-7d49-425a-9640-880defd337eb`;

  /** The four Zoom-group screenshots that ran alongside the online copy. */
  readonly onlineScreenshots = [
    `${CoachingWithImpactComponent.BUCKET}/Coaching-With-Impact%2FScreenshot%202025-01-06%20at%208.27.18%20AM.PNG?alt=media&token=db721517-b361-4509-bb6f-b88d51d51cd0`,
    `${CoachingWithImpactComponent.BUCKET}/Coaching-With-Impact%2FScreenshot%202025-01-06%20at%208.31.57%20AM.PNG?alt=media&token=819ea4e6-4911-40e8-bc41-84f59aa71073`,
    `${CoachingWithImpactComponent.BUCKET}/Coaching-With-Impact%2FScreenshot%202025-01-06%20at%208.32.05%20AM.PNG?alt=media&token=f4d7a657-e466-4834-8b2d-b949345916f4`,
    `${CoachingWithImpactComponent.BUCKET}/Coaching-With-Impact%2FScreenshot%202025-01-06%20at%208.32.14%20AM.PNG?alt=media&token=aa7ba169-93da-48c3-9a88-111993d0a2a3`,
  ];

  // Product ids the old page already linked to - the CTAs were rewired to
  // Angular routes at some point before this rebuild, so they carry over.
  readonly coachingBookRoute = '/product-details/rySK3NIIjWwWuBLTpxPc';
  readonly competingBookRoute = '/product-details/Th0IrFrIUElnj5urBzl6';
  readonly kevinBurrellRoute = '/team-details/AP4yP449P3iI7L0PsOVp';
  readonly consultationUrl = 'https://impact-discipleship-ministries.mykajabi.com/pl/2148229316';
  readonly progressReportVideoId = 'krHPH7SoQwU';

  /**
   * Every testimonial from the WordPress page, in full and unedited - they
   * are the strongest thing on this page, so the carousel exists to keep
   * all seven rather than to cut any.
   */
  readonly testimonials: CoachTestimonial[] = [
    {
      quote: [
        'Going through "Coaching with Impact" these past two years have been life changing and a true blessing. Meeting with my brothers in Christ; Kevin Burrell, John Small, Cam Smith, and Mark Bowles has really helped my growth and spiritual maturity in Christ. The sincerity that we each brought while working through the "Coaching with Impact" book has been priceless. Being and Building disciples of Christ, while exercising the character and conduct of Christ has been life changing for all of us. I know with certainty that this venture has helped my growth with the fruits of the spirit of love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self control. "GO, and make disciples of all nations, baptizing them in the name of the Father, Son, and Holy Spirit."',
      ],
      name: 'Franklin DeLoach',
      role: 'Head Baseball and Softball Coach, East Coweta High School',
    },
    {
      quote: [
        'The Coaching with Impact study, led by Kevin Burrell had a profound impact on me as a person and a Coach. I learned about the Character and Conduct of Jesus. Learning how Jesus led, influenced others, and prioritized building relationships was eye opening to me. I thought I did it well, but wow, had I fallen short. This study has both encouraged and challenged me to go beyond what I was doing as a Christian Coach. Understanding now the Great Commandment and Great Commission, and what we are called to be and do daily as a Coach who is called to build the Kingdom!',
      ],
      name: 'John Small',
      role: 'Head Football Coach, East Coweta High School',
    },
    {
      quote: [
        'There are two questions that I repeatedly would ask myself as I was going through the "Coaching with Impact" discipleship training. Am I leveraging my influence in a way that is producing disciples? Are the fruits of the Spirit on display in my life? We are called to Be and Build disciples of Jesus Christ, and as a coach, we have a platform and arena where we have the ability to leverage our influence to reach others for Jesus by developing relationships!',
        'I often find myself in situations where the days run long, things may not go as planned and the overall season is just a grind. These are the moments where "Coaching with Impact" has instilled in me the importance of seeking to live out the fruits of the Spirit in a way that others can see a difference in my life through the Character and Conduct of Jesus. This "Coaching with Impact" small group has taught me the importance of accountability, progress not perfection, and being fully trained in order to train and lead others!',
        'Two statements that stick with me are, "We are disciple-makers disguised as coaches" and "One day when I stand before Jesus He will not ask me how many games I won, but surely He will ask me if I was Being and Building disciples with my life."',
      ],
      name: 'Mark Bowles',
      role: 'Baseball and Softball Coach, East Coweta High School',
    },
    {
      quote: [
        'The "Coaching with Impact" study changed the way I look at discipleship and disciple-making. Really, it changed how I view my relationship with God and my mission in life. "Coaching with Impact" taught me about the mission God wants me to have and that is to "Be and Build Disciples" with my life. This mission was once thought by me as "just a missionary\'s job," however this couldn\'t be farther from the truth.',
        'Not only did my life mission change, but this study and this group of coaches helped me with tangible ways on how to Be a disciple and how to Build others to become fully trained disciples. This group equip me about the importance of living out the Character and Conduct of Christ as a coach, and to lead and multiply others through the same process. It was incredibly important to have guys who were set on the same mission as me, and to hold me accountable. This pushed me to hold the others accountable and something that will continue for the rest of my life.',
      ],
      name: 'Cam Smith',
      role: 'Math Teacher | Asst. Baseball Coach, East Coweta High School',
    },
    {
      quote: [
        'I am very thankful for this Coaching with Impact group and the opportunity to dive into God\'s Word with all the coaches. I appreciate your teaching, guidance and acceptance you have shown me. I don\'t mean to overshare in the group, but I just feel really comfortable with you all and trust you guys. This group has been extremely helpful for me personally, and is teaching me what it means to be a disciple and how to make disciples. I have never heard or been taught anything like this before. Thank you!',
      ],
      name: 'East Coweta High School Coach',
      role: '',
    },
    {
      quote: [
        'Coaching is a very rewarding profession, but it can also be very stressful. For years it was easy to lose focus on what the main goal of coaching was, resulting in stress and losing my joy. Part of my staff and I did a weekly discipleship study using the "Coaching with Impact" book and it completely changed my perspective on the game. I could feel a shift from stress to peace as I remembered the "fruit of the spirit" and exemplifying the conduct of Christ on the field as a head coach. The true objective we have as Christian coaches. To this day I am able to calm myself in the heat of the moment by reminding myself the game is not where my joy comes from. I recommend this book for any Christian or non-Christian coaching staff. It will truly help lead you and impact your program for the better.',
      ],
      name: 'Matt Hopkins',
      role: 'Head Baseball Coach, Houston County HS — Warner Robins, GA',
    },
    {
      quote: [
        'The small group discipleship I have been a part of has been a huge part of my spiritual growth. Being in consistent community has helped strengthened my faith, kept me accountable, and reminded me that I\'m not meant to walk this journey alone.',
        'Learning alongside others, praying together, and having people speak truth into my life has strengthened both my relationship with Christ and how I live it out daily. I have learned also that this journey in life, and the problems I face, are the same problems and issues others face. I am not alone!',
        'Our group met once a week for 10 weeks in the fall of 2025 using the book "Coaching with Impact" by Ken Adams. The book has been a great resource to guide our group and lead us in discipleship discussions each week. We are now meeting twice a month to connect and check in on each other.',
      ],
      name: 'Tom Griffin',
      role: 'Head Baseball Coach, Carson Newman University',
    },
  ];

  playVideo(): void {
    this.isPlaying = true;
  }

  ngAfterViewInit(): void {
    // The slides are static markup here (no async fetch as in
    // home-header-slider), so the view is already painted - but Swiper still
    // has to run after the @for has rendered, which ngAfterViewInit
    // guarantees.
    this.swiper = new Swiper('.cwi-testimonials__swiper', {
      modules: [Autoplay, Navigation, Pagination],
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      speed: 600,
      autoHeight: true,
      // Deliberately slow: these are long quotes, and a reader part-way
      // through one should not have it move under them.
      autoplay: { delay: 12000, disableOnInteraction: true },
      pagination: { el: '.cwi-testimonials__pagination', clickable: true },
      navigation: {
        nextEl: '.cwi-testimonials__next',
        prevEl: '.cwi-testimonials__prev',
      },
      breakpoints: {
        992: { slidesPerView: 2 },
      },
    });
  }

  ngOnDestroy(): void {
    this.swiper?.destroy();
  }
}
