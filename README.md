# Portfolio — Victor Esteban

Personal portfolio site. Software Engineer · Backend / Integration / Production.

**Live:** https://victoresteban.com/

## Stack

- React 18, bundled with Vite
- Plain CSS; the services pages, 404 page and CVs are static HTML
- Hosted on GitHub Pages

## Design

"Cabanyal" direction: a light lime-wash ground, a Swiss 12-column grid and footnotes in the margin, set in Schibsted Grotesk with Instrument Serif italic accents. The one ornament is a band of simplified rajoles after the tiled façades of El Cabanyal, Valencia's old fishing quarter; it flips as one, cycling Flor → Estrella → Rombe → Cenefa → Ona. The mark is a minimal rosa dels vents. On scroll, section rules draw in, rows and list items rise in staggered and a thin progress line tracks the page. Switching language cross-fades where the browser supports View Transitions. All motion respects `prefers-reduced-motion`.

Content order: hero (with an at-a-glance panel beside the lede) → Work → Stack and Certifications side by side → Education & languages → Contact. The content runs up to 1440px wide with a fluid gutter; on phones everything stacks into one column.

## Languages

English by default, with an EN / ES switch in the header. The choice is remembered in the browser, and `?lang=es` links straight to the Spanish version. The CV links download the CV in the selected language.

## CV

A one-page A4 CV in the same style, with a sidebar (stack, certifications, education, languages) beside profile and experience. The main column comes first in the markup, so ATS parsers read it before the sidebar. `cv/en.html` and `cv/es.html` are the sources; `cv/build.mjs` prints them to `assets/Victor_Esteban_CV.pdf` and `assets/Victor_Esteban_CV_ES.pdf`:

```sh
npm install --no-save playwright-core
node cv/build.mjs   # CHROMIUM_PATH=/path/to/chrome to pick a browser
```

The build fails if the Google Fonts don't load or the content no longer fits on one page.

## Services for public administrations

`/administraciones/` is a separate static page (no scripts) offering web accessibility and AI services to town councils, in Spanish (`/administraciones/`), Valencian (`/administraciones/va/`) and English (`/administraciones/en/`). It reuses the Cabanyal tokens with its own layout and links to the portfolio; the portfolio does not link back. Copy lives in `administraciones/strings.mjs`; rebuild the three pages with:

```sh
node administraciones/build.mjs
```

`node tests/administraciones.test.mjs` fails if the committed pages are out of date or a language is missing copy.

The contact form posts to a Cloudflare Worker in `workers/contacto/` at `https://forms.victoresteban.com/contacto`. It checks the fields (with a honeypot against bots), emails the request through Cloudflare Email Routing with Reply-To set to the sender, stores nothing, and redirects to `/administraciones/gracias/` in the sender's language. To deploy it:

```sh
cd workers/contacto
npx wrangler login
npx wrangler secret put TO   # the verified Email Routing destination address
npx wrangler deploy          # also creates the forms.victoresteban.com custom domain
```

`node tests/contacto-worker.test.mjs` checks the Worker's parsing and email, and that the form and the Worker agree on fields and route.

## Structure

```
index.html              # Vite entry: SEO meta, JSON-LD, loads portfolios/main.jsx
vite.config.js          # Builds the portfolio; copies the static pages and assets into dist/ unchanged
404.html                # Static page GitHub Pages serves at any missing path (absolute URLs only)
robots.txt, sitemap.xml # Crawling: the portfolio and the three services pages
portfolios/
  main.jsx              # Mounts <CabanyalPortfolio />
  data.js               # Content (experience, skills, certifications, etc.); translatable fields are { en, es }
  i18n.js               # Interface copy (nav, headings, labels) per language
  cabanyal.jsx          # CabanyalPortfolio component, tile band, rosa mark
  cabanyal.css          # Layout, grid, motion and responsive styles
cv/
  en.html, es.html      # CV sources, one per language
  cv.css                # CV layout (A4, Cabanyal style)
  build.mjs             # Prints the CVs to assets/*.pdf
administraciones/
  strings.mjs           # Services page copy, per language (es, va, en)
  build.mjs             # Renders index.html, va/index.html and en/index.html
  administraciones.css  # Services page layout
assets/rajoles/         # One SVG per tile, used by the services page
workers/contacto/       # Cloudflare Worker that emails the contact form
tests/                  # Node assertion scripts (node tests/<file>.mjs)
```

## Local development

```sh
npm install
npm run dev       # http://localhost:5173
npm test          # every tests/*.test.mjs
npm run build     # dist/, then npm run preview to serve it
```

Edit `portfolios/data.js` to update content and `portfolios/i18n.js` for interface copy; `tests/i18n.test.mjs` checks both languages are complete and that periods use three-letter months. The JSON-LD in `index.html` repeats name, role, contact links and school from `data.js`; `tests/seo.test.mjs` fails if they drift apart. Edit `portfolios/cabanyal.jsx` and `portfolios/cabanyal.css` to change layout.

Vite bundles only the portfolio. `CNAME`, `404.html`, `robots.txt`, `sitemap.xml`, `assets/`, `administraciones/` (without its build scripts) and `portfolios/cabanyal.css` are copied into `dist/` as they are, so their URLs stay the same.

## Deployment

GitHub Pages must serve the built `dist/` folder, not the repository as it is: a GitHub Actions workflow builds on every push to `main` and deploys `dist/` to Pages (issue #11), with the Pages source set to "GitHub Actions".

## License

Content © Victor Esteban. Code MIT.
