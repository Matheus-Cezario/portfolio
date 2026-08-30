import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelIconComponent } from '../../shared/pixel-icon.component';
import {
  LANGUAGE_COLORS,
  PROFILE,
  PROJECTS,
  Project,
} from '../../data/portfolio';

@Component({
  selector: 'app-projects',
  imports: [PixelIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {
  protected readonly profile = PROFILE;
  protected readonly projects = PROJECTS;

  /** Explorer-style: pick a row, read the details in the pane below. */
  protected readonly selected = signal<Project>(PROJECTS[0]);

  select(project: Project): void {
    this.selected.set(project);
  }

  colorFor(project: Project): string {
    return LANGUAGE_COLORS[project.language] ?? '#808080';
  }

  onDoubleClick(repoRef?: string) {
    if (repoRef === null) return;
    window.open(repoRef, '_blank');
  }
}
