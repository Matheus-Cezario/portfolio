import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type PixelIconName =
  | 'computer'
  | 'notepad'
  | 'briefcase'
  | 'folder'
  | 'tools'
  | 'mail'
  | 'globe'
  | 'floppy'
  | 'paint';

/**
 * Hand-drawn 32x32 icons in the classic 16-colour palette, rendered with
 * `crispEdges` so they stay blocky at any size — the way the originals were.
 */
@Component({
  selector: 'app-pixel-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 32 32"
      shape-rendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name) {
        @case ('computer') {
          <rect x="3" y="4" width="26" height="19" fill="#c0c0c0" stroke="#0a0a0a" />
          <rect x="5" y="6" width="22" height="14" fill="#000080" />
          <rect x="6" y="7" width="9" height="1" fill="#00ffff" />
          <rect x="6" y="9" width="14" height="1" fill="#00ffff" />
          <rect x="6" y="11" width="6" height="1" fill="#00ffff" />
          <rect x="6" y="13" width="12" height="1" fill="#00ffff" />
          <rect x="12" y="23" width="8" height="3" fill="#808080" />
          <rect x="6" y="26" width="20" height="4" fill="#c0c0c0" stroke="#0a0a0a" />
          <rect x="8" y="28" width="10" height="1" fill="#808080" />
        }
        @case ('notepad') {
          <rect x="6" y="2" width="17" height="28" fill="#ffffff" stroke="#0a0a0a" />
          <rect x="23" y="8" width="6" height="22" fill="#ffffff" stroke="#0a0a0a" />
          <polygon points="23,2 29,8 23,8" fill="#c0c0c0" stroke="#0a0a0a" />
          <rect x="9" y="11" width="16" height="1" fill="#000080" />
          <rect x="9" y="14" width="16" height="1" fill="#808080" />
          <rect x="9" y="17" width="16" height="1" fill="#808080" />
          <rect x="9" y="20" width="16" height="1" fill="#808080" />
          <rect x="9" y="23" width="10" height="1" fill="#808080" />
        }
        @case ('briefcase') {
          <rect x="12" y="5" width="8" height="5" fill="none" stroke="#5c3a17" stroke-width="2" />
          <rect x="2" y="9" width="28" height="18" fill="#a9713b" stroke="#5c3a17" />
          <rect x="2" y="15" width="28" height="4" fill="#8a5a2b" />
          <rect x="13" y="14" width="6" height="6" fill="#c0c0c0" stroke="#5c3a17" />
          <rect x="3" y="10" width="26" height="1" fill="#c89a63" />
        }
        @case ('folder') {
          <polygon points="2,7 13,7 15,10 30,10 30,27 2,27" fill="#e0a800" stroke="#7a5c00" />
          <polygon points="2,12 30,12 30,27 2,27" fill="#ffd24a" stroke="#7a5c00" />
          <rect x="4" y="14" width="24" height="1" fill="#ffe9a8" />
        }
        @case ('tools') {
          <rect x="4" y="4" width="8" height="8" fill="#808080" stroke="#0a0a0a" />
          <rect
            x="13"
            y="10"
            width="5"
            height="18"
            transform="rotate(45 15 19)"
            fill="#dfdfdf"
            stroke="#0a0a0a"
          />
          <rect
            x="19"
            y="19"
            width="10"
            height="6"
            transform="rotate(45 24 22)"
            fill="#b06a2c"
            stroke="#0a0a0a"
          />
        }
        @case ('mail') {
          <rect x="2" y="7" width="28" height="19" fill="#ffffff" stroke="#0a0a0a" />
          <polygon points="2,7 16,18 30,7" fill="#dfdfdf" stroke="#0a0a0a" />
          <line x1="2" y1="26" x2="13" y2="16" stroke="#808080" />
          <line x1="30" y1="26" x2="19" y2="16" stroke="#808080" />
        }
        @case ('globe') {
          <circle cx="16" cy="16" r="13" fill="#1084d0" stroke="#0a0a0a" />
          <path d="M3 16h26M16 3c5 5 5 21 0 26M16 3c-5 5-5 21 0 26" fill="none" stroke="#ffffff" />
          <path d="M6 9c6 3 14 3 20 0M6 23c6-3 14-3 20 0" fill="none" stroke="#ffffff" />
        }
        @case ('floppy') {
          <rect x="3" y="3" width="26" height="26" fill="#3a3a3a" stroke="#0a0a0a" />
          <rect x="9" y="4" width="14" height="10" fill="#c0c0c0" />
          <rect x="17" y="5" width="4" height="8" fill="#808080" />
          <rect x="7" y="18" width="18" height="10" fill="#dfdfdf" />
          <rect x="9" y="20" width="10" height="1" fill="#808080" />
          <rect x="9" y="22" width="10" height="1" fill="#808080" />
        }
        @case ('paint') {
          <ellipse cx="14" cy="19" rx="12" ry="9" fill="#e8c9a0" stroke="#0a0a0a" />
          <circle cx="19" cy="23" r="3" fill="#c0c0c0" stroke="#0a0a0a" />
          <circle cx="7" cy="17" r="2" fill="#ff0000" />
          <circle cx="12" cy="13" r="2" fill="#ffff00" />
          <circle cx="18" cy="14" r="2" fill="#008000" />
          <circle cx="23" cy="17" r="2" fill="#0000ff" />
          <circle cx="8" cy="23" r="2" fill="#ff00ff" />
          <polygon points="24,3 29,8 21,16 19,14" fill="#c0c0c0" stroke="#0a0a0a" />
          <polygon points="19,14 21,16 17,20 15,18" fill="#804000" stroke="#0a0a0a" />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
        flex: 0 0 auto;
      }
    `,
  ],
})
export class PixelIconComponent {
  @Input({ required: true }) name!: PixelIconName;
  @Input() size = 32;
}
