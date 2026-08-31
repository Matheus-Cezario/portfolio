import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  inject,
} from '@angular/core';
import { PixelIconComponent } from '../shared/pixel-icon.component';
import { DEFAULT_MENUS, Win, WindowManagerService } from './window-manager.service';

/**
 * A draggable, resizable window frame. Content is projected into the body, so
 * every section component only worries about its own contents.
 */
@Component({
  selector: 'app-win-frame',
  imports: [PixelIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './win-frame.component.html',
  styleUrl: './win-frame.component.scss',
  host: {
    '[class.is-active]': 'isActive',
    '[class.is-maximized]': 'win.maximized()',
    '[hidden]': 'win.minimized()',
    '[style.left.px]': 'win.maximized() ? 0 : win.x()',
    '[style.top.px]': 'win.maximized() ? 0 : win.y()',
    '[style.width.px]': 'win.maximized() ? null : win.w()',
    '[style.height.px]': 'win.maximized() ? null : win.h()',
    '[style.z-index]': 'win.z()',
    '(pointerdown)': 'wm.focus(win.id)',
  },
})
export class WinFrameComponent {
  @Input({ required: true }) win!: Win;
  /** Menu bar labels — decorative, exactly as half of them were back then.
   *  An empty list hides the strip, for windows that draw a working menu. */
  @Input() menus: string[] = DEFAULT_MENUS;

  protected readonly wm = inject(WindowManagerService);
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);

  private origin = { pointerX: 0, pointerY: 0, x: 0, y: 0, w: 0, h: 0 };
  private mode: 'move' | 'resize' | null = null;

  get isActive(): boolean {
    return this.wm.activeId() === this.win.id;
  }

  startDrag(event: PointerEvent): void {
    if (event.button !== 0 || this.win.maximized()) return;
    this.begin(event, 'move');
  }

  startResize(event: PointerEvent): void {
    if (event.button !== 0 || this.win.maximized()) return;
    this.begin(event, 'resize');
  }

  private begin(event: PointerEvent, mode: 'move' | 'resize'): void {
    event.preventDefault();
    this.wm.focus(this.win.id);
    this.mode = mode;
    this.origin = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: this.win.x(),
      y: this.win.y(),
      w: this.win.w(),
      h: this.win.h(),
    };

    const target = event.target as HTMLElement;
    target.setPointerCapture?.(event.pointerId);
    this.host.nativeElement.classList.add('is-dragging');

    const onMove = (move: PointerEvent) => this.onPointerMove(move);
    const onUp = () => {
      this.mode = null;
      this.host.nativeElement.classList.remove('is-dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.mode) return;
    const dx = event.clientX - this.origin.pointerX;
    const dy = event.clientY - this.origin.pointerY;

    if (this.mode === 'move') {
      this.wm.moveTo(this.win, this.origin.x + dx, this.origin.y + dy);
    } else {
      this.wm.resizeTo(this.win, this.origin.w + dx, this.origin.h + dy);
    }
  }
}
