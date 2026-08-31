import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';

/** A row in a dropdown. A label of `-` renders a separator instead. */
export interface MenuEntry {
  label: string;
  accel?: string;
  action?: string;
  disabled?: boolean;
  /** Draws the radio dot the option menus used for the current setting. */
  checked?: boolean;
}

export interface MenuGroup {
  label: string;
  items: MenuEntry[];
}

/**
 * The menu bar the apps actually use — click to open, slide sideways to switch,
 * click anywhere else to dismiss. The window frame draws a decorative strip of
 * its own; a window with real menus asks for `menus: []` and renders this.
 */
@Component({
  selector: 'app-menu-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (menu of menus; track menu.label) {
      <div class="menu">
        <button
          type="button"
          class="label"
          [class.is-open]="open() === menu.label"
          [attr.aria-expanded]="open() === menu.label"
          (click)="toggle(menu.label)"
          (pointerenter)="hover(menu.label)"
        >
          {{ menu.label }}
        </button>

        @if (open() === menu.label) {
          <ul class="dropdown raised" role="menu">
            @for (item of menu.items; track $index) {
              @if (item.label === '-') {
                <li class="rule" aria-hidden="true"></li>
              } @else {
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    [disabled]="item.disabled"
                    (click)="run(item)"
                  >
                    <span class="tick" aria-hidden="true">{{ item.checked ? '•' : '' }}</span>
                    <span class="text">{{ item.label }}</span>
                    <span class="accel">{{ item.accel ?? '' }}</span>
                  </button>
                </li>
              }
            }
          </ul>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        gap: 2px;
        flex: 0 0 auto;
        padding: 1px 1px 3px;
        font-size: 11px;
      }

      .menu {
        position: relative;
      }

      .label,
      .dropdown button {
        border: 0;
        background: transparent;
        color: var(--text);
        font-family: var(--font);
        font-size: 11px;
        line-height: 1.4;
        cursor: default;
      }

      .label {
        padding: 1px 6px;
      }

      .label:hover,
      .label.is-open {
        background: var(--sel);
        color: var(--sel-text);
      }

      .dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 20;
        min-width: 160px;
        padding: 2px;
        filter: drop-shadow(2px 2px 0 rgba(0, 0, 0, 0.35));
      }

      .dropdown button {
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
        padding: 3px 10px 3px 4px;
        text-align: left;
      }

      .dropdown button:hover:not([disabled]) {
        background: var(--sel);
        color: var(--sel-text);
      }

      .dropdown button[disabled] {
        color: var(--disabled);
        text-shadow: 1px 1px 0 var(--disabled-hi);
      }

      .tick {
        width: 8px;
        flex: 0 0 auto;
      }

      .text {
        flex: 1;
      }

      .accel {
        flex: 0 0 auto;
      }

      .rule {
        height: 2px;
        margin: 3px 2px;
        box-shadow:
          inset 0 1px 0 0 var(--shadow),
          inset 0 -1px 0 0 var(--white);
      }
    `,
  ],
})
export class MenuBarComponent {
  @Input({ required: true }) menus: MenuGroup[] = [];
  @Output() choose = new EventEmitter<string>();

  protected readonly open = signal<string | null>(null);

  private readonly host = inject(ElementRef<HTMLElement>);

  toggle(label: string): void {
    this.open.update((current) => (current === label ? null : label));
  }

  /** Sliding across the bar with a menu open switches menus, as it should. */
  hover(label: string): void {
    if (this.open()) this.open.set(label);
  }

  run(item: MenuEntry): void {
    if (item.disabled || !item.action) return;
    this.open.set(null);
    this.choose.emit(item.action);
  }

  close(): void {
    this.open.set(null);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
