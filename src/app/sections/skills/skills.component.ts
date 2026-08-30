import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SKILLS } from '../../data/portfolio';

@Component({
  selector: 'app-skills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
})
export class SkillsComponent {
  protected readonly groups = SKILLS;
}
