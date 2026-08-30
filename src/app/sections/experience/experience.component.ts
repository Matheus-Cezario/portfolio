import { ChangeDetectionStrategy, Component } from '@angular/core';
import { JOBS } from '../../data/portfolio';

@Component({
  selector: 'app-experience',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.scss',
})
export class ExperienceComponent {
  protected readonly jobs = JOBS;
}
