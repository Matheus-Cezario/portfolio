# Portfolio — Matheus Cezário

Personal portfolio site, built with Angular 19 (standalone components, zoneless-ready
signals, no router — it is a single scrolling page).

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
  featured: true,                        // optional — adds the accent glow
}
```

Every link is optional, so a project whose code stays private still gets a card:

- no `repo` — the GitHub icon and title link disappear, and the footer notes
  _private source_ next to the language;
- `learnMore` — a pill button pointing at docs, a write-up or a recorded demo. It
  takes precedence over `demo` in the footer, so set only one of the two.

New languages need an entry in `LANGUAGE_COLORS` at the bottom of the same file,
otherwise the dot falls back to grey.

## Structure

```
src/
  styles.scss                 design tokens + shared layout helpers (.shell, .section, .chip)
  app/
    data/portfolio.ts         all content
    shared/
      icon.component.ts       inline SVG icon set
      reveal.directive.ts     [appReveal] fade-in on scroll, with optional stagger in ms
    sections/
      nav/                    sticky header, scroll spy, mobile menu
      hero/                   name, tagline, CTAs, stats
      about/                  summary + education panel
      experience/             timeline
      projects/               GitHub project grid
      skills/                 grouped skill chips
      contact/                contact panel + footer
```

## Theming

Colours, radii and fonts are CSS custom properties on `:root` in `src/styles.scss`.
The palette is dark-only by design; swapping `--accent` and `--accent-2` re-skins the
whole page.

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

The résumé PDF is served from `public/matheus-cezario-resume.pdf` and linked from the hero.
