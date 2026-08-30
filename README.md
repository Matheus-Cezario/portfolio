# Portfolio — Matheus Cezário

Personal portfolio site, built with Angular 19 (standalone components, signal-based
state, no router). The site is a Windows 9x/2000-style desktop: each part of the CV
opens as a window that can be dragged, minimised, maximised, resized and closed.

## Running

```bash
npm start           # dev server on http://localhost:4200
npm run build       # production bundle into dist/portfolio
```

## Where the content lives

Everything shown on the page comes from one file:

```
src/app/data/portfolio.ts
```

It exports `PROFILE`, `JOBS`, `PROJECTS`, `SKILLS`, `COURSES` and `STATS`. Editing that
file is the only thing needed to update the site — no component touches hardcoded copy.

To add a project, push a new object onto `PROJECTS`:

```ts
{
  name: 'Repo name',
  blurb: 'One or two sentences on what it does and why it exists.',
  language: 'Python',                    // drives the coloured dot
  stack: ['Python', 'FastAPI'],
  repo: 'https://github.com/...',        // optional — omit for closed-source work
  demo: 'https://live-demo',             // optional — renders a "Live demo" link
  learnMore: 'https://docs-or-video',    // optional — renders a "Learn more" button
  featured: true,                        // optional — shows the floppy icon in the list
}
```

Every link is optional, so a project whose code stays private still gets a row:

- no `repo` — the details pane shows a disabled _Private source_ button instead of the
  source-code link;
- `learnMore` — a button pointing at docs, a write-up or a recorded demo, shown next to
  the source and demo links.

New languages need an entry in `LANGUAGE_COLORS` at the bottom of the same file,
otherwise the dot falls back to grey.

## Structure

```
src/
  styles.scss                 palette + 3D bevel helpers (.raised, .sunken, .btn9x, .pane9x)
  app/
    data/portfolio.ts         all content
    shared/
      icon.component.ts       inline SVG icon set (links)
      pixel-icon.component.ts 32x32 blocky icons in the 16-colour palette
    desktop/
      window-manager.service.ts  open/close/focus/minimise/maximise, z-order, geometry
      win-frame.component.*      window chrome: title bar, menu bar, drag and resize
      desktop.component.*        wallpaper, desktop icons, mounted windows
      taskbar.component.*        Start button and menu, task buttons, tray clock
    sections/
      welcome/                Welcome.txt — intro, stats, shortcut buttons
      about/                  summary + education panel
      experience/             job history as grouped panels
      projects/               Explorer-style list with a details pane
      skills/                 grouped skill boxes
      contact/                contact fields + links
```

### Adding a window

1. Add an id to `WindowId` and an entry to `WINDOW_DEFS` in `window-manager.service.ts`
   (title, icon, default size).
2. Build the content component — give its `:host` `display: flex; flex-direction: column;
   flex: 1; min-height: 0` and put the body in a single `.pane9x` scroller.
3. Render it under a new `@case` in `desktop.component.html` and, if it should sit on the
   wallpaper, add it to `icons` in `desktop.component.ts`.

Keep **one** scrolling container per window. Nested `overflow: auto` boxes whose widths
depend on each other can make Chrome loop on layout and hang the tab; `.pane9x` sets
`scrollbar-gutter: stable` for the same reason.

## Theming

The classic palette lives as CSS custom properties on `:root` in `src/styles.scss`:
`--face`, `--face-light`, `--shadow` and `--dark` build every bevel, `--title-a1`/`--title-a2`
paint the active title bar, and `--desktop` is the wallpaper. Everything is square by
design — no radii, no transitions.

## Deploying

The build output is a static bundle, so any static host works:

```bash
npm run build
# then serve dist/portfolio/browser
```

For GitHub Pages, build with the repo name as the base href:

```bash
npx ng build --base-href /portfolio/
```

The résumé PDF is served from `public/matheus-cezario-resume.pdf` and linked from the
Start menu and the Welcome window.
