import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../shared/icon.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { LANGUAGE_COLORS, PROFILE, PROJECTS, Project } from '../../data/portfolio';

@Component({
  selector: 'app-projects',
  imports: [IconComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {
  readonly profile = PROFILE;
  readonly projects = PROJECTS;

  colorFor(project: Project): string {
    return LANGUAGE_COLORS[project.language] ?? 'var(--text-faint)';
  }
}
