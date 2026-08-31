import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cell, MinesweeperComponent } from './minesweeper.component';

describe('MinesweeperComponent', () => {
  let fixture: ComponentFixture<MinesweeperComponent>;
  let game: any;

  const cellAt = (row: number, col: number): Cell =>
    game.cells().find((cell: Cell) => cell.row === row && cell.col === col);

  const click = (cell: Cell, button = 0) => {
    game.onCellDown(cell, new PointerEvent('pointerdown', { button, buttons: button === 2 ? 2 : 1 }));
    game.onCellUp(cell, new PointerEvent('pointerup', { button }));
  };

  /** Replaces the random field with a known one: mines wherever `plan` says. */
  const plant = (plan: string[]) => {
    const cells: Cell[] = game.cells();
    for (const cell of cells) cell.mine = plan[cell.row][cell.col] === '*';
    for (const cell of cells) {
      cell.adjacent = game.neighbours(cell, cells).filter((n: Cell) => n.mine).length;
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MinesweeperComponent] }).compileComponents();
    fixture = TestBed.createComponent(MinesweeperComponent);
    fixture.detectChanges();
    game = fixture.componentInstance;
  });

  it('lays a beginner field of 81 squares, all hidden', () => {
    expect(game.cells().length).toBe(81);
    expect(game.cells().every((cell: Cell) => cell.state() === 'hidden')).toBe(true);
    expect(game.counterText()).toBe('010');
    expect(game.clockText()).toBe('000');
  });

  it('never puts a mine under the opening click', () => {
    for (let attempt = 0; attempt < 40; attempt++) {
      game.reset();
      const first = cellAt(4, 4);
      click(first);
      expect(first.mine).toBe(false);
      expect(game.status()).not.toBe('lost');
    }
  });

  it('lays exactly the right number of mines', () => {
    click(cellAt(0, 0));
    expect(game.cells().filter((cell: Cell) => cell.mine).length).toBe(10);
  });

  it('opens the whole empty region on a blank square', () => {
    click(cellAt(8, 8));
    plant([
      '*........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
    ]);
    game.status.set('playing');
    game.revealed = 0;
    for (const cell of game.cells()) cell.state.set('hidden');

    game.reveal(cellAt(8, 8));

    // Everything but the mine is now open, so the game is won.
    expect(cellAt(0, 1).state()).toBe('revealed');
    expect(cellAt(1, 1).adjacent).toBe(1);
    expect(game.status()).toBe('won');
    expect(game.face()).toBe('cool');
  });

  it('cycles flag, query mark and back, tracking the counter', () => {
    const cell = cellAt(2, 2);

    click(cell, 2);
    expect(cell.state()).toBe('flag');
    expect(game.counterText()).toBe('009');

    click(cell, 2);
    expect(cell.state()).toBe('question');
    expect(game.counterText()).toBe('010');

    click(cell, 2);
    expect(cell.state()).toBe('hidden');
  });

  it('skips the query mark when Marks is switched off', () => {
    game.onMenuChoose('marks');
    const cell = cellAt(2, 2);
    click(cell, 2);
    click(cell, 2);
    expect(cell.state()).toBe('hidden');
  });

  it('refuses to open a flagged square', () => {
    const cell = cellAt(3, 3);
    click(cell, 2);
    click(cell);
    expect(cell.state()).toBe('flag');
    expect(game.status()).toBe('ready');
  });

  it('ends the game on a mine, showing the field and the wrong flags', () => {
    click(cellAt(8, 8));
    plant([
      '*........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
    ]);
    const wrong = cellAt(5, 5);
    wrong.state.set('flag');

    game.reveal(cellAt(0, 0));

    expect(cellAt(0, 0).state()).toBe('exploded');
    expect(wrong.state()).toBe('wrong');
    expect(game.status()).toBe('lost');
    expect(game.face()).toBe('dead');
  });

  it('chords a satisfied number open and leaves an unsatisfied one alone', () => {
    click(cellAt(8, 8));
    plant([
      '*........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
      '.........',
    ]);
    for (const cell of game.cells()) cell.state.set('hidden');
    game.status.set('playing');

    const number = cellAt(1, 1);
    number.state.set('revealed');
    expect(number.adjacent).toBe(1);

    // No flag yet, so chording must do nothing.
    game.chord(number);
    expect(cellAt(0, 1).state()).toBe('hidden');

    cellAt(0, 0).state.set('flag');
    game.chord(number);
    expect(cellAt(0, 1).state()).toBe('revealed');
    expect(cellAt(2, 2).state()).toBe('revealed');
  });

  it('flags on a long press, since touch has no second button', (done) => {
    const cell = cellAt(4, 4);
    game.onCellDown(cell, new PointerEvent('pointerdown', { button: 0, buttons: 1, pointerType: 'touch' }));

    setTimeout(() => {
      expect(cell.state()).toBe('flag');
      // The release must not then open the square it just flagged.
      game.onCellUp(cell, new PointerEvent('pointerup', { button: 0 }));
      expect(cell.state()).toBe('flag');
      expect(game.status()).toBe('ready');
      done();
    }, 450);
  });

  it('opens normally on a short touch tap', (done) => {
    const cell = cellAt(4, 4);
    game.onCellDown(cell, new PointerEvent('pointerdown', { button: 0, buttons: 1, pointerType: 'touch' }));

    setTimeout(() => {
      game.onCellUp(cell, new PointerEvent('pointerup', { button: 0 }));
      expect(cell.state()).toBe('revealed');
      done();
    }, 100);
  });

  it('resizes the board when the level changes', () => {
    game.setLevel('expert');
    expect(game.cells().length).toBe(480);
    expect(game.counterText()).toBe('099');
    expect(game.board().cols).toBe(30);
  });
});
