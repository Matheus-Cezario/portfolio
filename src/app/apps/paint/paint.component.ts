import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { WindowManagerService } from '../../desktop/window-manager.service';

export type PaintTool =
  | 'pencil'
  | 'brush'
  | 'airbrush'
  | 'eraser'
  | 'fill'
  | 'picker'
  | 'line'
  | 'rect'
  | 'roundrect'
  | 'ellipse';

/** Shapes are drawn as an outline, an outline over a fill, or a fill alone. */
export type ShapeStyle = 'outline' | 'both' | 'filled';

interface Point {
  x: number;
  y: number;
}

type PaintAction =
  | 'new'
  | 'save'
  | 'undo'
  | 'redo'
  | 'clear'
  | 'flip-h'
  | 'flip-v'
  | 'invert'
  | 'edit-colors'
  | 'about';

interface MenuItem {
  label: string;
  accel?: string;
  action?: PaintAction;
}

/** The 28 colours of the original palette, in two rows of fourteen. */
const PALETTE = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080',
  '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff',
  '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040',
];

const CANVAS_W = 480;
const CANVAS_H = 320;

/** What an empty bitmap is, and what the eraser puts back. */
const PAPER = '#ffffff';

/** Stroke widths offered by the tool-options box, in bitmap pixels. */
const WIDTHS = [1, 2, 3, 5, 8];

const UNDO_DEPTH = 16;

/**
 * Paint, as it shipped in 1995: toolbox on the left, tool options underneath,
 * the palette along the bottom and a status bar with the cursor position. The
 * bitmap is a fixed 480x320 that scrolls inside its sunken well, so resizing
 * the window never throws the drawing away.
 *
 * The left button paints with the foreground colour and the right button with
 * the background colour, the way it always did.
 */
@Component({
  selector: 'app-paint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paint.component.html',
  styleUrl: './paint.component.scss',
})
export class PaintComponent implements AfterViewInit {
  @ViewChild('surface') private surfaceRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('colorInput') private colorInputRef!: ElementRef<HTMLInputElement>;

  protected readonly palette = PALETTE;
  protected readonly widths = WIDTHS;
  protected readonly canvasW = CANVAS_W;
  protected readonly canvasH = CANVAS_H;

  protected readonly tools: { id: PaintTool; label: string }[] = [
    { id: 'pencil', label: 'Pencil' },
    { id: 'brush', label: 'Brush' },
    { id: 'airbrush', label: 'Airbrush' },
    { id: 'eraser', label: 'Eraser' },
    { id: 'fill', label: 'Fill With Color' },
    { id: 'picker', label: 'Pick Color' },
    { id: 'line', label: 'Line' },
    { id: 'rect', label: 'Rectangle' },
    { id: 'roundrect', label: 'Rounded Rectangle' },
    { id: 'ellipse', label: 'Ellipse' },
  ];

  protected readonly menus: { label: string; items: MenuItem[] }[] = [
    {
      label: 'File',
      items: [
        { label: 'New', accel: 'Ctrl+N', action: 'new' },
        { label: 'Save As...', accel: 'Ctrl+S', action: 'save' },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', accel: 'Ctrl+Z', action: 'undo' },
        { label: 'Repeat', accel: 'Ctrl+Y', action: 'redo' },
        { label: '-' },
        { label: 'Clear Image', action: 'clear' },
      ],
    },
    {
      label: 'Image',
      items: [
        { label: 'Flip Horizontal', action: 'flip-h' },
        { label: 'Flip Vertical', action: 'flip-v' },
        { label: '-' },
        { label: 'Invert Colors', accel: 'Ctrl+I', action: 'invert' },
      ],
    },
    {
      label: 'Colors',
      items: [{ label: 'Edit Colors...', action: 'edit-colors' }],
    },
    {
      label: 'Help',
      items: [{ label: 'About Paint', action: 'about' }],
    },
  ];

  protected readonly tool = signal<PaintTool>('pencil');
  protected readonly foreground = signal('#000000');
  protected readonly background = signal(PAPER);
  protected readonly width = signal(1);
  protected readonly shapeStyle = signal<ShapeStyle>('outline');
  protected readonly coords = signal<Point | null>(null);
  protected readonly openMenu = signal<string | null>(null);
  protected readonly aboutOpen = signal(false);
  protected readonly canUndo = signal(false);
  protected readonly canRedo = signal(false);

  /** Free-hand and straight-line tools share the width picker. */
  protected readonly showsWidths = computed(() =>
    ['brush', 'airbrush', 'eraser', 'line'].includes(this.tool()),
  );
  protected readonly showsShapeStyle = computed(() =>
    ['rect', 'roundrect', 'ellipse'].includes(this.tool()),
  );
  protected readonly hint = computed(
    () => this.tools.find((tool) => tool.id === this.tool())?.label ?? '',
  );

  private readonly wm = inject(WindowManagerService);
  private readonly host = inject(ElementRef<HTMLElement>);

  private ctx!: CanvasRenderingContext2D;
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];

  private drawing = false;
  /** True while the right button paints, which swaps the two colours. */
  private secondary = false;
  private origin: Point = { x: 0, y: 0 };
  private last: Point = { x: 0, y: 0 };
  private constrain = false;
  /** Pixels captured before a shape drag, replayed for every preview frame. */
  private preview: ImageData | null = null;
  private sprayTimer: number | null = null;
  private previousTool: PaintTool = 'pencil';

  ngAfterViewInit(): void {
    const canvas = this.surfaceRef.nativeElement;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.ctx.fillStyle = PAPER;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ---------------------------------------------------------------- toolbox

  selectTool(id: PaintTool): void {
    if (id !== 'picker') this.previousTool = id;
    this.tool.set(id);
  }

  chooseColor(event: MouseEvent, color: string): void {
    if (event.button === 2) this.background.set(color);
    else this.foreground.set(color);
  }

  swapColors(): void {
    const foreground = this.foreground();
    this.foreground.set(this.background());
    this.background.set(foreground);
  }

  // ------------------------------------------------------------------ menus

  toggleMenu(label: string): void {
    this.openMenu.update((open) => (open === label ? null : label));
  }

  /** Sliding across the bar with a menu open switches menus, as it should. */
  hoverMenu(label: string): void {
    if (this.openMenu()) this.openMenu.set(label);
  }

  isDisabled(item: MenuItem): boolean {
    if (item.action === 'undo') return !this.canUndo();
    if (item.action === 'redo') return !this.canRedo();
    return false;
  }

  run(item: MenuItem): void {
    if (!item.action || this.isDisabled(item)) return;
    this.openMenu.set(null);
    this.exec(item.action);
  }

  onCustomColor(event: Event): void {
    this.foreground.set((event.target as HTMLInputElement).value);
  }

  private exec(action: PaintAction): void {
    switch (action) {
      case 'new':
      case 'clear':
        this.clearImage();
        break;
      case 'save':
        this.save();
        break;
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
      case 'flip-h':
        this.flip('h');
        break;
      case 'flip-v':
        this.flip('v');
        break;
      case 'invert':
        this.invert();
        break;
      case 'edit-colors':
        this.colorInputRef.nativeElement.click();
        break;
      case 'about':
        this.aboutOpen.set(true);
        break;
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.openMenu()) return;
    const target = event.target as HTMLElement;
    if (!this.host.nativeElement.contains(target) || !target.closest('.menubar')) {
      this.openMenu.set(null);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.wm.activeId() !== 'paint') return;

    if (event.key === 'Escape') {
      this.openMenu.set(null);
      this.aboutOpen.set(false);
      return;
    }
    if (!event.ctrlKey && !event.metaKey) return;

    const shortcuts: Record<string, PaintAction> = {
      z: 'undo',
      y: 'redo',
      n: 'new',
      s: 'save',
      i: 'invert',
    };
    const action = shortcuts[event.key.toLowerCase()];
    if (!action) return;
    if (action === 'undo' && !this.canUndo()) return;
    if (action === 'redo' && !this.canRedo()) return;
    event.preventDefault();
    this.exec(action);
  }

  // ----------------------------------------------------------------- canvas

  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    this.openMenu.set(null);

    const point = this.positionOf(event);
    this.secondary = event.button === 2;
    this.constrain = event.shiftKey;

    if (this.tool() === 'picker') {
      this.pickFromCanvas(point);
      return;
    }

    this.pushUndo();
    const canvas = this.surfaceRef.nativeElement;
    this.capture(event.pointerId, true);
    this.drawing = true;
    this.origin = point;
    this.last = point;

    switch (this.tool()) {
      case 'fill':
        this.floodFill(point, this.paintColor());
        break;
      case 'pencil':
        this.pencilLine(point, point);
        break;
      case 'brush':
        this.brushLine(point, point);
        break;
      case 'eraser':
        this.eraseAt(point);
        break;
      case 'airbrush':
        this.spray(point);
        this.sprayTimer = window.setInterval(() => this.spray(this.last), 60);
        break;
      default:
        // Shape tools repaint from this snapshot on every move.
        this.preview = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  }

  onPointerMove(event: PointerEvent): void {
    const point = this.positionOf(event);
    this.coords.set(point);
    if (!this.drawing) return;
    this.constrain = event.shiftKey;

    switch (this.tool()) {
      case 'pencil':
        this.pencilLine(this.last, point);
        this.last = point;
        break;
      case 'brush':
        this.brushLine(this.last, point);
        this.last = point;
        break;
      case 'eraser':
        this.eraseLine(this.last, point);
        this.last = point;
        break;
      case 'airbrush':
        this.last = point;
        this.spray(point);
        break;
      case 'line':
      case 'rect':
      case 'roundrect':
      case 'ellipse':
        this.drawShape(point);
        break;
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.drawing) return;
    this.capture(event.pointerId, false);
    this.drawing = false;
    this.preview = null;
    if (this.sprayTimer !== null) {
      clearInterval(this.sprayTimer);
      this.sprayTimer = null;
    }
  }

  onPointerLeave(): void {
    this.coords.set(null);
  }

  /**
   * Capture keeps a stroke alive when the pointer wanders off the bitmap. It
   * throws for pointers the browser no longer tracks, and losing capture must
   * never cost us the stroke itself, so the failure is swallowed.
   */
  private capture(pointerId: number, grab: boolean): void {
    const canvas = this.surfaceRef.nativeElement;
    try {
      if (grab) canvas.setPointerCapture(pointerId);
      else canvas.releasePointerCapture(pointerId);
    } catch {
      // No capture: the stroke still tracks the pointer over the canvas.
    }
  }

  /** Maps a pointer event onto bitmap pixels, honouring any CSS scaling. */
  private positionOf(event: PointerEvent): Point {
    const canvas = this.surfaceRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.floor(((event.clientX - rect.left) * canvas.width) / rect.width),
      y: Math.floor(((event.clientY - rect.top) * canvas.height) / rect.height),
    };
  }

  /** The colour this drag paints with — the two swap on a right-drag. */
  private paintColor(): string {
    return this.secondary ? this.background() : this.foreground();
  }

  private otherColor(): string {
    return this.secondary ? this.foreground() : this.background();
  }

  // ------------------------------------------------------------ drawing ops

  /** Bresenham, a pixel at a time, so the pencil stays as hard-edged as the original. */
  private pencilLine(from: Point, to: Point): void {
    this.ctx.fillStyle = this.paintColor();
    let x = from.x;
    let y = from.y;
    const dx = Math.abs(to.x - x);
    const dy = -Math.abs(to.y - y);
    const sx = x < to.x ? 1 : -1;
    const sy = y < to.y ? 1 : -1;
    let err = dx + dy;

    for (;;) {
      this.ctx.fillRect(x, y, 1, 1);
      if (x === to.x && y === to.y) break;
      const doubled = 2 * err;
      if (doubled >= dy) {
        err += dy;
        x += sx;
      }
      if (doubled <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /** The smallest brush was a single hard pixel, so it falls back to the pencil. */
  private brushLine(from: Point, to: Point): void {
    if (this.width() === 1) this.pencilLine(from, to);
    else this.strokeLine(from, to, this.paintColor(), this.width());
  }

  private strokeLine(from: Point, to: Point, color: string, width: number): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(from.x + 0.5, from.y + 0.5);
    this.ctx.lineTo(to.x + 0.5, to.y + 0.5);
    this.ctx.stroke();
  }

  /**
   * A square block that takes the bitmap back to paper. The original erased
   * with the background colour and swapped in the foreground on a right-drag,
   * which reads as painting rather than erasing — both buttons clear here.
   */
  private eraseAt(point: Point): void {
    const size = this.width() * 4;
    this.ctx.fillStyle = PAPER;
    this.ctx.fillRect(Math.round(point.x - size / 2), Math.round(point.y - size / 2), size, size);
  }

  private eraseLine(from: Point, to: Point): void {
    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1);
    for (let step = 0; step <= steps; step++) {
      this.eraseAt({
        x: Math.round(from.x + ((to.x - from.x) * step) / steps),
        y: Math.round(from.y + ((to.y - from.y) * step) / steps),
      });
    }
  }

  private spray(point: Point): void {
    const radius = this.width() * 3 + 2;
    this.ctx.fillStyle = this.paintColor();
    for (let dot = 0; dot < radius * 2; dot++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      this.ctx.fillRect(
        Math.round(point.x + Math.cos(angle) * distance),
        Math.round(point.y + Math.sin(angle) * distance),
        1,
        1,
      );
    }
  }

  private drawShape(point: Point): void {
    if (!this.preview) return;
    this.ctx.putImageData(this.preview, 0, 0);

    const end = this.constrain ? this.constrained(point) : point;
    const color = this.paintColor();

    if (this.tool() === 'line') {
      if (this.width() === 1) this.pencilLine(this.origin, end);
      else this.strokeLine(this.origin, end, color, this.width());
      return;
    }

    const x = Math.min(this.origin.x, end.x);
    const y = Math.min(this.origin.y, end.y);
    const w = Math.abs(end.x - this.origin.x);
    const h = Math.abs(end.y - this.origin.y);
    const style = this.shapeStyle();

    // Rectangles are laid down as solid bands: a stroked path leaves the
    // rasteriser to soften the corners, and these have to stay square.
    if (this.tool() === 'rect') {
      this.drawRect(x, y, w + 1, h + 1, style, color);
      return;
    }

    this.ctx.beginPath();
    if (this.tool() === 'ellipse') {
      this.ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    } else {
      this.roundRectPath(x + 0.5, y + 0.5, w, h, Math.min(12, w / 2, h / 2));
    }

    if (style !== 'outline') {
      // An outlined-and-filled shape takes the *other* colour inside, like Paint.
      this.ctx.fillStyle = style === 'filled' ? color : this.otherColor();
      this.ctx.fill();
    }
    if (style !== 'filled') {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = this.width();
      this.ctx.stroke();
    }
  }

  private drawRect(x: number, y: number, w: number, h: number, style: ShapeStyle, color: string): void {
    if (style !== 'outline') {
      this.ctx.fillStyle = style === 'filled' ? color : this.otherColor();
      this.ctx.fillRect(x, y, w, h);
    }
    if (style !== 'filled') {
      const edge = Math.min(this.width(), w, h);
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, w, edge);
      this.ctx.fillRect(x, y + h - edge, w, edge);
      this.ctx.fillRect(x, y, edge, h);
      this.ctx.fillRect(x + w - edge, y, edge, h);
    }
  }

  private roundRectPath(x: number, y: number, w: number, h: number, r: number): void {
    const radius = Math.max(0, r);
    this.ctx.moveTo(x + radius, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, radius);
    this.ctx.arcTo(x + w, y + h, x, y + h, radius);
    this.ctx.arcTo(x, y + h, x, y, radius);
    this.ctx.arcTo(x, y, x + w, y, radius);
    this.ctx.closePath();
  }

  /** Shift snaps lines to 45 degrees and boxes to squares. */
  private constrained(point: Point): Point {
    const dx = point.x - this.origin.x;
    const dy = point.y - this.origin.y;

    if (this.tool() === 'line') {
      const angle = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI) / 4;
      const length = Math.hypot(dx, dy);
      return {
        x: Math.round(this.origin.x + Math.cos(angle) * length),
        y: Math.round(this.origin.y + Math.sin(angle) * length),
      };
    }

    const side = Math.max(Math.abs(dx), Math.abs(dy));
    return {
      x: this.origin.x + Math.sign(dx || 1) * side,
      y: this.origin.y + Math.sign(dy || 1) * side,
    };
  }

  private pickFromCanvas(point: Point): void {
    const [r, g, b] = this.ctx.getImageData(point.x, point.y, 1, 1).data;
    const hex = '#' + [r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('');
    if (this.secondary) this.background.set(hex);
    else this.foreground.set(hex);
    this.tool.set(this.previousTool);
  }

  /** Four-way flood fill over exact colour matches. */
  private floodFill(point: Point, color: string): void {
    const { width, height } = this.surfaceRef.nativeElement;
    if (point.x < 0 || point.y < 0 || point.x >= width || point.y >= height) return;

    const image = this.ctx.getImageData(0, 0, width, height);
    const data = image.data;
    const start = (point.y * width + point.x) * 4;
    const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
    const fill = this.rgbaOf(color);
    if (target.every((channel, index) => channel === fill[index])) return;

    const stack: number[] = [point.x, point.y];
    while (stack.length) {
      const y = stack.pop()!;
      const x = stack.pop()!;
      const index = (y * width + x) * 4;
      if (
        data[index] !== target[0] ||
        data[index + 1] !== target[1] ||
        data[index + 2] !== target[2] ||
        data[index + 3] !== target[3]
      ) {
        continue;
      }

      data[index] = fill[0];
      data[index + 1] = fill[1];
      data[index + 2] = fill[2];
      data[index + 3] = fill[3];

      if (x > 0) stack.push(x - 1, y);
      if (x < width - 1) stack.push(x + 1, y);
      if (y > 0) stack.push(x, y - 1);
      if (y < height - 1) stack.push(x, y + 1);
    }

    this.ctx.putImageData(image, 0, 0);
  }

  private rgbaOf(hex: string): [number, number, number, number] {
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255];
  }

  // ------------------------------------------------------------- image menu

  private clearImage(): void {
    this.pushUndo();
    const canvas = this.surfaceRef.nativeElement;
    this.ctx.fillStyle = PAPER;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private flip(axis: 'h' | 'v'): void {
    this.pushUndo();
    const canvas = this.surfaceRef.nativeElement;
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    copy.getContext('2d')!.drawImage(canvas, 0, 0);

    this.ctx.save();
    this.ctx.setTransform(
      axis === 'h' ? -1 : 1,
      0,
      0,
      axis === 'v' ? -1 : 1,
      axis === 'h' ? canvas.width : 0,
      axis === 'v' ? canvas.height : 0,
    );
    this.ctx.drawImage(copy, 0, 0);
    this.ctx.restore();
  }

  private invert(): void {
    this.pushUndo();
    const canvas = this.surfaceRef.nativeElement;
    const image = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    this.ctx.putImageData(image, 0, 0);
  }

  private save(): void {
    const link = document.createElement('a');
    link.download = 'untitled.png';
    link.href = this.surfaceRef.nativeElement.toDataURL('image/png');
    link.click();
  }

  // -------------------------------------------------------------- undo/redo

  private pushUndo(): void {
    const canvas = this.surfaceRef.nativeElement;
    this.undoStack.push(this.ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (this.undoStack.length > UNDO_DEPTH) this.undoStack.shift();
    this.redoStack = [];
    this.canUndo.set(true);
    this.canRedo.set(false);
  }

  private undo(): void {
    const previous = this.undoStack.pop();
    if (!previous) return;
    const canvas = this.surfaceRef.nativeElement;
    this.redoStack.push(this.ctx.getImageData(0, 0, canvas.width, canvas.height));
    this.ctx.putImageData(previous, 0, 0);
    this.canUndo.set(this.undoStack.length > 0);
    this.canRedo.set(true);
  }

  private redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    const canvas = this.surfaceRef.nativeElement;
    this.undoStack.push(this.ctx.getImageData(0, 0, canvas.width, canvas.height));
    this.ctx.putImageData(next, 0, 0);
    this.canUndo.set(true);
    this.canRedo.set(this.redoStack.length > 0);
  }
}
