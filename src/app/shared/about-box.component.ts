import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * The little modal every applet had under Help. Content is projected, so each
 * app writes its own blurb; clicking the shade or OK dismisses it.
 */
@Component({
  selector: 'app-about-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shade" (pointerdown)="close.emit()">
      <div
        class="box raised"
        role="dialog"
        [attr.aria-label]="heading"
        (pointerdown)="$event.stopPropagation()"
      >
        <div class="title">{{ heading }}</div>
        <div class="body">
          <ng-content />
          <div class="buttons">
            <button type="button" class="btn9x" (click)="close.emit()">OK</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .shade {
        position: absolute;
        inset: 0;
        z-index: 30;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
      }

      .box {
        width: 260px;
        max-width: 100%;
        padding: 3px;
        filter: drop-shadow(3px 3px 0 rgba(0, 0, 0, 0.35));
      }

      .title {
        height: 20px;
        padding: 2px 4px 0;
        background: linear-gradient(90deg, var(--title-a1), var(--title-a2));
        color: #fff;
        font-size: 11px;
        font-weight: bold;
      }

      .body {
        padding: 12px 12px 10px;
      }

      .buttons {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
      }
    `,
  ],
})
export class AboutBoxComponent {
  @Input({ required: true }) heading = '';
  @Output() close = new EventEmitter<void>();
}
