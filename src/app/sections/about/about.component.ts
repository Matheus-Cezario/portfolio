import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COURSES, PROFILE } from '../../data/portfolio';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  protected readonly profile = PROFILE;
  protected readonly courses = COURSES;
}
