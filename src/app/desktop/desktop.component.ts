import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PixelIconComponent } from '../shared/pixel-icon.component';
import { AboutComponent } from '../sections/about/about.component';
import { ContactComponent } from '../sections/contact/contact.component';
import { ExperienceComponent } from '../sections/experience/experience.component';
import { ProjectsComponent } from '../sections/projects/projects.component';
import { SkillsComponent } from '../sections/skills/skills.component';
import { WelcomeComponent } from '../sections/welcome/welcome.component';
import { TaskbarComponent } from './taskbar.component';
import { WinFrameComponent } from './win-frame.component';
import { WINDOW_DEFS, WindowId, WindowManagerService } from './window-manager.service';

interface DesktopIcon {
  id: WindowId;
  label: string;
}

@Component({
  selector: 'app-desktop',
  imports: [
    PixelIconComponent,
    TaskbarComponent,
    WinFrameComponent,
    WelcomeComponent,
    AboutComponent,
    ExperienceComponent,
    ProjectsComponent,
    SkillsComponent,
    ContactComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './desktop.component.html',
  styleUrl: './desktop.component.scss',
})
export class DesktopComponent {
  protected readonly wm = inject(WindowManagerService);
  protected readonly defs = WINDOW_DEFS;

  protected readonly icons: DesktopIcon[] = [
    { id: 'about', label: 'About Me' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'My Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'contact', label: 'Contact' },
    { id: 'welcome', label: 'Welcome.txt' },
  ];

  protected readonly selected = signal<WindowId | null>(null);

  /** Touch devices get single-tap opening; a mouse still expects a double click. */
  private readonly coarsePointer =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  constructor() {
    this.wm.open('welcome');
  }

  iconFor(id: WindowId) {
    return this.defs.find((def) => def.id === id)!.icon;
  }

  onIconClick(id: WindowId): void {
    this.selected.set(id);
    if (this.coarsePointer) this.wm.open(id);
  }

  onIconOpen(id: WindowId): void {
    this.selected.set(id);
    this.wm.open(id);
  }

  clearSelection(event: Event): void {
    if (event.target === event.currentTarget) this.selected.set(null);
  }
}
