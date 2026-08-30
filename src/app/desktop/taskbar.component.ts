import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { PixelIconComponent } from '../shared/pixel-icon.component';
import { PROFILE } from '../data/portfolio';
import { WINDOW_DEFS, WindowId, WindowManagerService } from './window-manager.service';

@Component({
  selector: 'app-taskbar',
  imports: [PixelIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './taskbar.component.html',
  styleUrl: './taskbar.component.scss',
})
export class TaskbarComponent {
  protected readonly wm = inject(WindowManagerService);
  protected readonly profile = PROFILE;
  protected readonly programs = WINDOW_DEFS;

  readonly startOpen = signal(false);
  readonly clock = signal(this.formatTime());

  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    const timer = setInterval(() => this.clock.set(this.formatTime()), 15_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Clicking anywhere outside dismisses the Start menu, as it should. */
  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.startOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.startOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.startOpen.set(false);
  }

  toggleStart(): void {
    this.startOpen.update((open) => !open);
  }

  launch(id: WindowId): void {
    this.wm.open(id);
    this.startOpen.set(false);
  }

  shutDown(): void {
    this.startOpen.set(false);
    this.wm.closeAll();
  }

  private formatTime(): string {
    return new Date().toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
