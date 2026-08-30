import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';

/**
 * Fades an element in once it scrolls into view. Falls back to showing the
 * element immediately when IntersectionObserver is unavailable.
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  /** Stagger, in milliseconds, applied before the element animates in. */
  @Input('appReveal') delay: number | string = 0;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const el = this.host.nativeElement as HTMLElement;
    this.renderer.addClass(el, 'reveal');

    const delay = Number(this.delay) || 0;
    if (delay > 0) {
      this.renderer.setStyle(el, 'transition-delay', `${delay}ms`);
    }

    if (typeof IntersectionObserver === 'undefined') {
      this.renderer.addClass(el, 'is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          this.renderer.addClass(el, 'is-visible');
          this.observer?.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
