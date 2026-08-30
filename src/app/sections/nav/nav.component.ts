import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { IconComponent } from '../../shared/icon.component';
import { PROFILE } from '../../data/portfolio';

interface NavLink {
  id: string;
  label: string;
}

@Component({
  selector: 'app-nav',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent implements AfterViewInit, OnDestroy {
  readonly profile = PROFILE;
  readonly links: NavLink[] = [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'contact', label: 'Contact' },
  ];

  readonly scrolled = signal(false);
  readonly active = signal<string>('');
  readonly menuOpen = signal(false);

  private readonly cdr = inject(ChangeDetectorRef);
  private spy?: IntersectionObserver;

  @HostListener('window:scroll')
  onScroll(): void {
    const next = window.scrollY > 24;
    if (next !== this.scrolled()) {
      this.scrolled.set(next);
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        this.active.set(visible.target.id);
        this.cdr.markForCheck();
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    );

    for (const link of this.links) {
      const el = document.getElementById(link.id);
      if (el) this.spy.observe(el);
    }
  }

  ngOnDestroy(): void {
    this.spy?.disconnect();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
