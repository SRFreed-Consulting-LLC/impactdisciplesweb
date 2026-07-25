import { Directive, ElementRef, Renderer2, Input, OnInit } from '@angular/core';

@Directive({
    selector: '[animate]',
    standalone: false
})
export class AnimateDirective implements OnInit {
  @Input('animate') animationClass: string = 'fadeInUp'; // Default animation class

  private observer: IntersectionObserver;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Set up the Intersection Observer
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add the animation class when the element is visible
          this.renderer.addClass(this.el.nativeElement, this.animationClass);
          this.observer.unobserve(this.el.nativeElement); // Stop observing once it's animated
        }
      });
    }, { threshold: 0.1 });

    // Start observing the element
    this.observer.observe(this.el.nativeElement);
  }
}