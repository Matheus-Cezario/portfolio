import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaintComponent } from './paint.component';

describe('PaintComponent', () => {
  let fixture: ComponentFixture<PaintComponent>;
  let canvas: HTMLCanvasElement;

  const pixelAt = (x: number, y: number) =>
    Array.from(canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);

  const down = (x: number, y: number, button = 0) => {
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: rect.left + x,
        clientY: rect.top + y,
        button,
        bubbles: true,
      }),
    );
  };

  const move = (x: number, y: number) => {
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX: rect.left + x,
        clientY: rect.top + y,
        bubbles: true,
      }),
    );
  };

  const up = () => canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaintComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaintComponent);
    fixture.detectChanges();
    canvas = fixture.nativeElement.querySelector('canvas');
  });

  it('starts as a white bitmap', () => {
    expect(pixelAt(10, 10)).toEqual([255, 255, 255, 255]);
  });

  it('draws with the pencil and undoes the stroke', () => {
    down(20, 20);
    move(40, 20);
    up();
    expect(pixelAt(30, 20)).toEqual([0, 0, 0, 255]);

    (fixture.componentInstance as any).undo();
    expect(pixelAt(30, 20)).toEqual([255, 255, 255, 255]);
  });

  it('paints with the background colour on a right-drag', () => {
    const paint = fixture.componentInstance as any;
    paint.foreground.set('#ff0000');
    paint.background.set('#0000ff');
    fixture.detectChanges();

    down(60, 60, 2);
    move(80, 60);
    up();
    expect(pixelAt(70, 60)).toEqual([0, 0, 255, 255]);
  });

  it('erases back to paper with either button, whatever the palette holds', () => {
    const paint = fixture.componentInstance as any;
    paint.foreground.set('#ff0000');
    paint.background.set('#0000ff');
    paint.selectTool('fill');
    fixture.detectChanges();
    down(5, 5);
    up();
    expect(pixelAt(200, 150)).toEqual([255, 0, 0, 255]);

    paint.selectTool('eraser');
    fixture.detectChanges();

    down(100, 150);
    move(200, 150);
    up();
    expect(pixelAt(150, 150)).toEqual([255, 255, 255, 255]);

    // A right-drag erases too — it must not lay down the foreground colour.
    down(100, 250, 2);
    move(200, 250);
    up();
    expect(pixelAt(150, 250)).toEqual([255, 255, 255, 255]);
  });

  it('floods a bounded region with the fill tool', () => {
    const paint = fixture.componentInstance as any;
    paint.selectTool('fill');
    paint.foreground.set('#00ff00');
    fixture.detectChanges();

    down(5, 5);
    up();
    expect(pixelAt(400, 300)).toEqual([0, 255, 0, 255]);
  });

  it('picks a colour off the bitmap and returns to the previous tool', () => {
    const paint = fixture.componentInstance as any;
    paint.foreground.set('#ff0000');
    paint.selectTool('brush');
    fixture.detectChanges();

    down(100, 100);
    up();

    paint.selectTool('picker');
    paint.foreground.set('#000000');
    down(100, 100);

    expect(paint.foreground()).toBe('#ff0000');
    expect(paint.tool()).toBe('brush');
  });

  it('previews a shape without keeping the intermediate frames', () => {
    const paint = fixture.componentInstance as any;
    paint.selectTool('rect');
    fixture.detectChanges();

    down(200, 100);
    move(300, 200);
    move(260, 160);
    up();

    // The discarded 300,200 corner must be white again.
    expect(pixelAt(300, 200)).toEqual([255, 255, 255, 255]);
    // ...and the corner it settled on must be a hard black pixel.
    expect(pixelAt(260, 160)).toEqual([0, 0, 0, 255]);
    expect(pixelAt(200, 100)).toEqual([0, 0, 0, 255]);
  });

  it('inverts the image from the Image menu', () => {
    const paint = fixture.componentInstance as any;
    paint.exec('invert');
    expect(pixelAt(10, 10)).toEqual([0, 0, 0, 255]);
  });
});
