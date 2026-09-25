# Portfolio — Victor Esteban

Personal portfolio site. Software Engineer · Backend / Integration / Production.

**Live:** https://vicxs.github.io/portfolio/

## Stack

- React 18 (UMD)
- Babel Standalone (in-browser JSX transform)
- Plain HTML/CSS — no build step
- Hosted on GitHub Pages

## Design

"Cabanyal" direction: a light lime-wash ground, a Swiss 12-column grid and footnotes in the margin, set in Schibsted Grotesk with Instrument Serif italic accents. The one ornament is a band of simplified rajoles after the tiled façades of El Cabanyal, Valencia's old fishing quarter; it flips as one, cycling Flor → Estrella → Rombe → Cenefa → Ona. The mark is a minimal rosa dels vents. On scroll, section rules draw in, rows and list items rise in staggered and a thin progress line tracks the page. All motion respects `prefers-reduced-motion`.

Content order: hero → Work → Stack → Education & certifications → Contact.

## Languages

English by default, with an EN / ES switch in the header. The choice is remembered in the browser, and `?lang=es` links straight to the Spanish version. The CV links download the CV in the selected language.

## CV

A one-page A4 CV in the same style, with a sidebar (stack, certifications, education, languages) beside profile and experience. The main column comes first in the markup, so ATS parsers read it before the sidebar. `cv/en.html` and `cv/es.html` are the sources; `cv/build.mjs` prints them to `assets/Victor_Esteban_CV.pdf` and `assets/Victor_Esteban_CV_ES.pdf`:

```sh
npm install --no-save playwright-core
node cv/build.mjs   # CHROMIUM_PATH=/path/to/chrome to pick a browser
```

The build fails if the Google Fonts don't load or the content no longer fits on one page.

## Structure

```
index.html              # Entry; loads React + mounts <CabanyalPortfolio />
portfolios/
  data.js               # Content (experience, skills, certifications, etc.); translatable fields are { en, es }
  i18n.js               # Interface copy (nav, headings, labels) per language
  cabanyal.jsx          # CabanyalPortfolio component, tile band, rosa mark
  cabanyal.css          # Layout, grid, motion and responsive styles
cv/
  en.html, es.html      # CV sources, one per language
  cv.css                # CV layout (A4, Cabanyal style)
  build.mjs             # Prints the CVs to assets/*.pdf
tests/                  # Node assertion scripts (node tests/<file>.mjs)
```

## Local development

Open `index.html` over a static server (file:// breaks `<script src>` in some browsers):

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Edit `portfolios/data.js` to update content and `portfolios/i18n.js` for interface copy; `node tests/i18n.test.mjs` checks both languages are complete. Edit `portfolios/cabanyal.jsx` and `portfolios/cabanyal.css` to change layout.

## Deployment

Pushes to `main` deploy automatically via GitHub Pages (root `/`).

## License

Content © Victor Esteban. Code MIT.
