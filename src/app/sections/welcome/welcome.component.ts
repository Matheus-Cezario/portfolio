import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WindowId, WindowManagerService } from '../../desktop/window-manager.service';
import { PROFILE, STATS } from '../../data/portfolio';

@Component({
  selector: 'app-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent {
  protected readonly profile = PROFILE;
  protected readonly stats = STATS;

  private readonly wm = inject(WindowManagerService);

  open(id: WindowId): void {
    this.wm.open(id);
  }
}
