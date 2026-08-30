import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../shared/icon.component';
import { PROFILE } from '../../data/portfolio';

@Component({
  selector: 'app-contact',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  protected readonly profile = PROFILE;
  protected readonly year = new Date().getFullYear();
}
