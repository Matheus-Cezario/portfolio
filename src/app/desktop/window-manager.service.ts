import { Injectable, WritableSignal, computed, signal } from '@angular/core';
import { PixelIconName } from '../shared/pixel-icon.component';

export type WindowId =
  | 'welcome'
  | 'about'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'contact'
  | 'paint'
  | 'minesweeper';

interface WindowDef {
  id: WindowId;
  title: string;
  icon: PixelIconName;
  width: number;
  height: number;
  /** Menu-bar labels for the frame; `[]` for windows that draw their own. */
  menus?: string[];
}

/** What the decorative frame menu says unless a window asks for something else. */
export const DEFAULT_MENUS = ['File', 'Edit', 'View', 'Help'];

/** A window that is currently on the desktop. Every mutable field is a signal
 *  so dragging only re-renders the frame that moved. */
export interface Win extends WindowDef {
  x: WritableSignal<number>;
  y: WritableSignal<number>;
  w: WritableSignal<number>;
  h: WritableSignal<number>;
  z: WritableSignal<number>;
  minimized: WritableSignal<boolean>;
  maximized: WritableSignal<boolean>;
  /** Geometry to restore when un-maximising. */
  prev: { x: number; y: number; w: number; h: number } | null;
}

export const WINDOW_DEFS: WindowDef[] = [
  { id: 'welcome', title: 'Welcome.txt — Notepad', icon: 'notepad', width: 560, height: 430 },
  { id: 'about', title: 'About Me', icon: 'computer', width: 620, height: 460 },
  { id: 'experience', title: 'Work Experience', icon: 'briefcase', width: 660, height: 500 },
  { id: 'projects', title: 'My Projects', icon: 'folder', width: 700, height: 500 },
  { id: 'skills', title: 'Skills', icon: 'tools', width: 580, height: 460 },
  { id: 'contact', title: 'Contact', icon: 'mail', width: 520, height: 400 },
  // Paint owns its menu bar, so the frame leaves the strip to it.
  { id: 'paint', title: 'untitled - Paint', icon: 'paint', width: 640, height: 520, menus: [] },
  { id: 'minesweeper', title: 'Minesweeper', icon: 'mine', width: 300, height: 320, menus: [] },
];

export const TASKBAR_HEIGHT = 30;

const MIN_W = 280;
const MIN_H = 180;

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  readonly windows = signal<Win[]>([]);
  readonly activeId = signal<WindowId | null>(null);

  /** Windows in the order they were opened — the taskbar never reshuffles. */
  readonly taskbarItems = computed(() => this.windows());

  private topZ = 10;
  private cascade = 0;

  isOpen(id: WindowId): boolean {
    return this.windows().some((win) => win.id === id);
  }

  /** Opens the window, or focuses (and unminimises) it when already on screen. */
  open(id: WindowId): void {
    const existing = this.windows().find((win) => win.id === id);
    if (existing) {
      existing.minimized.set(false);
      this.focus(id);
      return;
    }

    const def = WINDOW_DEFS.find((d) => d.id === id);
    if (!def) return;

    const { x, y, w, h } = this.placeNew(def);
    const win: Win = {
      ...def,
      x: signal(x),
      y: signal(y),
      w: signal(w),
      h: signal(h),
      z: signal(++this.topZ),
      minimized: signal(false),
      maximized: signal(false),
      prev: null,
    };

    this.windows.update((list) => [...list, win]);
    this.activeId.set(id);
  }

  close(id: WindowId): void {
    this.windows.update((list) => list.filter((win) => win.id !== id));
    if (this.activeId() === id) {
      const rest = this.windows().filter((win) => !win.minimized());
      const top = rest.sort((a, b) => a.z() - b.z()).pop();
      this.activeId.set(top?.id ?? null);
    }
  }

  closeAll(): void {
    this.windows.set([]);
    this.activeId.set(null);
    this.cascade = 0;
  }

  focus(id: WindowId): void {
    const win = this.windows().find((w) => w.id === id);
    if (!win) return;
    if (this.activeId() !== id) this.activeId.set(id);
    if (win.z() !== this.topZ) win.z.set(++this.topZ);
  }

  /** Taskbar click: focus, or minimise when it is already the active window. */
  toggleFromTaskbar(id: WindowId): void {
    const win = this.windows().find((w) => w.id === id);
    if (!win) return;

    if (win.minimized()) {
      win.minimized.set(false);
      this.focus(id);
      return;
    }

    if (this.activeId() === id) {
      this.minimize(id);
      return;
    }

    this.focus(id);
  }

  minimize(id: WindowId): void {
    const win = this.windows().find((w) => w.id === id);
    if (!win) return;
    win.minimized.set(true);
    if (this.activeId() === id) {
      const next = this.windows()
        .filter((w) => w.id !== id && !w.minimized())
        .sort((a, b) => a.z() - b.z())
        .pop();
      this.activeId.set(next?.id ?? null);
    }
  }

  toggleMaximize(id: WindowId): void {
    const win = this.windows().find((w) => w.id === id);
    if (!win) return;

    if (win.maximized()) {
      if (win.prev) {
        win.x.set(win.prev.x);
        win.y.set(win.prev.y);
        win.w.set(win.prev.w);
        win.h.set(win.prev.h);
      }
      win.maximized.set(false);
    } else {
      win.prev = { x: win.x(), y: win.y(), w: win.w(), h: win.h() };
      win.maximized.set(true);
    }
    this.focus(id);
  }

  moveTo(win: Win, x: number, y: number): void {
    const area = this.desktopSize();
    // Keep at least a strip of the title bar reachable on every edge.
    win.x.set(Math.min(Math.max(x, 40 - win.w()), area.width - 40));
    win.y.set(Math.min(Math.max(y, 0), area.height - 24));
  }

  resizeTo(win: Win, w: number, h: number): void {
    const area = this.desktopSize();
    win.w.set(Math.min(Math.max(w, MIN_W), area.width - win.x()));
    win.h.set(Math.min(Math.max(h, MIN_H), area.height - win.y()));
  }

  /** Fits a window to its content — Minesweeper grows with the board. */
  sizeToContent(id: WindowId, width: number, height: number): void {
    const win = this.windows().find((w) => w.id === id);
    if (!win || win.maximized()) return;

    const area = this.desktopSize();
    const w = Math.max(Math.min(width, area.width), MIN_W);
    const h = Math.max(Math.min(height, area.height), MIN_H);
    // Pull it back on screen first, or the clamp in resizeTo would eat the growth.
    if (win.x() + w > area.width) win.x.set(Math.max(0, area.width - w));
    if (win.y() + h > area.height) win.y.set(Math.max(0, area.height - h));
    win.w.set(w);
    win.h.set(h);
  }

  desktopSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: Math.max(window.innerHeight - TASKBAR_HEIGHT, 240),
    };
  }

  /** Cascades new windows down and to the right; on phones they fill the screen. */
  private placeNew(def: WindowDef): { x: number; y: number; w: number; h: number } {
    const area = this.desktopSize();
    const compact = area.width < 760;
    const step = this.cascade++ % 6;

    if (compact) {
      const w = Math.max(MIN_W, area.width - 16);
      const h = Math.min(def.height, area.height - 24);
      return { x: Math.round((area.width - w) / 2), y: 8 + step * 10, w, h };
    }

    const w = Math.min(def.width, area.width - 160);
    const h = Math.min(def.height, area.height - 50);
    // Start past the icon column so the desktop icons stay clickable.
    const x = Math.min(120 + step * 28, Math.max(8, area.width - w - 12));
    const y = Math.min(28 + step * 26, Math.max(8, area.height - h - 12));
    return { x, y, w, h };
  }
}
