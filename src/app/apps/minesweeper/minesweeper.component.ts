import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AboutBoxComponent } from '../../shared/about-box.component';
import { MenuBarComponent, MenuGroup } from '../../shared/menu-bar.component';
import { WindowManagerService } from '../../desktop/window-manager.service';

export type Level = 'beginner' | 'intermediate' | 'expert';

/** What a square shows. Mines only differ from `revealed` once the game is lost. */
type CellState = 'hidden' | 'flag' | 'question' | 'revealed' | 'exploded' | 'wrong';

type Status = 'ready' | 'playing' | 'won' | 'lost';

type Face = 'happy' | 'worried' | 'dead' | 'cool';

export interface Cell {
  readonly index: number;
  readonly row: number;
  readonly col: number;
  /** Both are settled when the mines are laid, after the opening click. */
  mine: boolean;
  adjacent: number;
  state: WritableSignal<CellState>;
}

interface Board {
  rows: number;
  cols: number;
  mines: number;
}

const BOARDS: Record<Level, Board> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
};

const CELL = 16;
/** Window chrome around the grid: frame, menu bar, the counter row and padding. */
const CHROME_W = 76;
const CHROME_H = 168;

/**
 * Minesweeper. Left button clears a square, right button cycles flag and query
 * mark, and pressing both over a satisfied number chords its neighbours open.
 *
 * The mines are laid *after* the opening click and never under it, which is how
 * the original avoided losing you the game on move one.
 */
@Component({
  selector: 'app-minesweeper',
  imports: [MenuBarComponent, AboutBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './minesweeper.component.html',
  styleUrl: './minesweeper.component.scss',
})
export class MinesweeperComponent {
  protected readonly level = signal<Level>('beginner');
  protected readonly marks = signal(true);
  protected readonly cells = signal<Cell[]>([]);
  protected readonly status = signal<Status>('ready');
  protected readonly face = signal<Face>('happy');
  protected readonly flags = signal(0);
  protected readonly elapsed = signal(0);
  protected readonly aboutOpen = signal(false);

  protected readonly board = computed(() => BOARDS[this.level()]);

  /** The counter runs down as flags go out, and does go negative. */
  protected readonly minesLeft = computed(() => this.board().mines - this.flags());

  protected readonly menus = computed<MenuGroup[]>(() => [
    {
      label: 'Game',
      items: [
        { label: 'New', accel: 'F2', action: 'new' },
        { label: '-' },
        ...(Object.keys(BOARDS) as Level[]).map((level) => ({
          label: LEVEL_LABELS[level],
          action: level,
          checked: this.level() === level,
        })),
        { label: '-' },
        { label: 'Marks (?)', action: 'marks', checked: this.marks() },
      ],
    },
    { label: 'Help', items: [{ label: 'About Minesweeper', action: 'about' }] },
  ]);

  private readonly wm = inject(WindowManagerService);

  private revealed = 0;
  private timer: number | null = null;
  /** Set when a square is pressed with both buttons, so the release chords. */
  private chording = false;
  /** Touch has no second button, so a long press plants the flag instead. */
  private pressTimer: number | null = null;
  private longPressed = false;

  constructor() {
    this.reset();
    inject(DestroyRef).onDestroy(() => {
      this.stopClock();
      this.cancelLongPress();
    });
  }

  // ------------------------------------------------------------------- menus

  onMenuChoose(action: string): void {
    if (action === 'new') this.reset();
    else if (action === 'marks') this.marks.update((on) => !on);
    else if (action === 'about') this.aboutOpen.set(true);
    else this.setLevel(action as Level);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.wm.activeId() !== 'minesweeper') return;
    if (event.key === 'Escape') {
      this.aboutOpen.set(false);
      return;
    }
    if (event.key === 'F2') {
      event.preventDefault();
      this.reset();
    }
  }

  setLevel(level: Level): void {
    this.level.set(level);
    this.reset();
    const { rows, cols } = this.board();
    this.wm.sizeToContent('minesweeper', cols * CELL + CHROME_W, rows * CELL + CHROME_H);
  }

  reset(): void {
    const { rows, cols } = this.board();
    const cells: Cell[] = [];
    for (let index = 0; index < rows * cols; index++) {
      cells.push({
        index,
        row: Math.floor(index / cols),
        col: index % cols,
        mine: false,
        adjacent: 0,
        state: signal<CellState>('hidden'),
      });
    }

    this.cells.set(cells);
    this.status.set('ready');
    this.face.set('happy');
    this.flags.set(0);
    this.elapsed.set(0);
    this.revealed = 0;
    this.chording = false;
    this.stopClock();
  }

  // ------------------------------------------------------------------ mouse

  onCellDown(cell: Cell, event: PointerEvent): void {
    if (this.isOver()) return;

    // Both buttons down over a number chords it open on release.
    if (event.buttons === 3 || event.button === 1) {
      this.chording = true;
      this.face.set('worried');
      return;
    }

    if (event.button === 2) {
      this.cycleMark(cell);
      return;
    }
    if (event.button !== 0) return;
    this.face.set('worried');
    if (event.pointerType === 'touch') this.armLongPress(cell);
  }

  private armLongPress(cell: Cell): void {
    this.cancelLongPress();
    this.longPressed = false;
    this.pressTimer = window.setTimeout(() => {
      this.longPressed = true;
      this.pressTimer = null;
      this.cycleMark(cell);
      this.face.set('happy');
    }, 400);
  }

  private cancelLongPress(): void {
    if (this.pressTimer === null) return;
    clearTimeout(this.pressTimer);
    this.pressTimer = null;
  }

  onCellUp(cell: Cell, event: PointerEvent): void {
    this.cancelLongPress();
    if (this.isOver()) return;

    // The long press already planted a flag; the release must not open it.
    if (this.longPressed) {
      this.longPressed = false;
      this.settleFace();
      return;
    }

    if (this.chording) {
      this.chording = false;
      this.chord(cell);
      this.settleFace();
      return;
    }

    if (event.button !== 0) return;
    this.reveal(cell);
    this.settleFace();
  }

  /** A press that wanders off the grid still has to un-worry the face. */
  @HostListener('document:pointerup')
  onDocumentPointerUp(): void {
    this.chording = false;
    this.cancelLongPress();
    if (!this.isOver()) this.face.set('happy');
  }

  private settleFace(): void {
    if (this.status() === 'lost') this.face.set('dead');
    else if (this.status() === 'won') this.face.set('cool');
    else this.face.set('happy');
  }

  private isOver(): boolean {
    return this.status() === 'won' || this.status() === 'lost';
  }

  // ------------------------------------------------------------------- play

  private cycleMark(cell: Cell): void {
    const state = cell.state();
    if (state === 'revealed' || state === 'exploded') return;

    if (state === 'hidden') {
      cell.state.set('flag');
      this.flags.update((count) => count + 1);
      return;
    }
    if (state === 'flag') {
      cell.state.set(this.marks() ? 'question' : 'hidden');
      this.flags.update((count) => count - 1);
      return;
    }
    cell.state.set('hidden');
  }

  private reveal(cell: Cell): void {
    const state = cell.state();
    if (state === 'flag' || state === 'revealed' || state === 'exploded') return;

    if (this.status() === 'ready') {
      this.layMines(cell.index);
      this.status.set('playing');
      this.startClock();
    }

    if (cell.mine) {
      this.lose(cell);
      return;
    }

    this.open(cell);
    this.checkWin();
  }

  /** Opens a square, and its neighbours too when it has no mines around it. */
  private open(start: Cell): void {
    const cells = this.cells();
    const queue = [start];

    while (queue.length) {
      const cell = queue.pop()!;
      const state = cell.state();
      if (state === 'revealed' || state === 'flag') continue;

      cell.state.set('revealed');
      this.revealed++;
      if (cell.adjacent > 0) continue;

      for (const neighbour of this.neighbours(cell, cells)) {
        if (neighbour.state() === 'hidden' || neighbour.state() === 'question') {
          queue.push(neighbour);
        }
      }
    }
  }

  /** Clears around a satisfied number — the classic two-button shortcut. */
  private chord(cell: Cell): void {
    if (cell.state() !== 'revealed' || cell.adjacent === 0) return;

    const cells = this.cells();
    const around = this.neighbours(cell, cells);
    const flagged = around.filter((neighbour) => neighbour.state() === 'flag').length;
    if (flagged !== cell.adjacent) return;

    for (const neighbour of around) {
      const state = neighbour.state();
      if (state !== 'hidden' && state !== 'question') continue;
      if (neighbour.mine) {
        this.lose(neighbour);
        return;
      }
      this.open(neighbour);
    }
    this.checkWin();
  }

  private lose(hit: Cell): void {
    hit.state.set('exploded');
    for (const cell of this.cells()) {
      if (cell.mine && cell.state() !== 'exploded' && cell.state() !== 'flag') {
        cell.state.set('revealed');
      }
      // A flag on a safe square is crossed out once the board is shown.
      if (!cell.mine && cell.state() === 'flag') cell.state.set('wrong');
    }
    this.status.set('lost');
    this.face.set('dead');
    this.stopClock();
  }

  private checkWin(): void {
    const { rows, cols, mines } = this.board();
    if (this.revealed < rows * cols - mines) return;

    for (const cell of this.cells()) {
      if (cell.mine && cell.state() !== 'flag') cell.state.set('flag');
    }
    this.flags.set(mines);
    this.status.set('won');
    this.face.set('cool');
    this.stopClock();
  }

  /**
   * Mines go down after the opening click and never under it, so the first
   * square is always safe.
   */
  private layMines(safeIndex: number): void {
    const cells = this.cells();
    const { mines } = this.board();
    const pool = cells.filter((cell) => cell.index !== safeIndex);

    for (let placed = 0; placed < mines && pool.length; placed++) {
      const pick = Math.floor(Math.random() * pool.length);
      pool[pick].mine = true;
      pool.splice(pick, 1);
    }

    for (const cell of cells) {
      cell.adjacent = this.neighbours(cell, cells).filter((n) => n.mine).length;
    }
  }

  private neighbours(cell: Cell, cells: Cell[]): Cell[] {
    const { rows, cols } = this.board();
    const found: Cell[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const row = cell.row + dr;
        const col = cell.col + dc;
        if (row < 0 || col < 0 || row >= rows || col >= cols) continue;
        found.push(cells[row * cols + col]);
      }
    }
    return found;
  }

  // ------------------------------------------------------------------ clock

  private startClock(): void {
    this.stopClock();
    this.timer = window.setInterval(() => {
      this.elapsed.update((seconds) => Math.min(seconds + 1, 999));
    }, 1000);
  }

  private stopClock(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  // ---------------------------------------------------------------- display

  /** Three characters wide, like the LED panels, negatives included. */
  protected readonly counterText = computed(() => this.pad(this.minesLeft()));
  protected readonly clockText = computed(() => this.pad(this.elapsed()));

  private pad(value: number): string {
    if (value < 0) return '-' + String(Math.min(-value, 99)).padStart(2, '0');
    return String(Math.min(value, 999)).padStart(3, '0');
  }
}
