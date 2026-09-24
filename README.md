# Portfolio — Victor Esteban

Personal portfolio site. Software Engineer · Backend in production & AI-assisted engineering.

**Live:** https://vicxs.github.io/portfolio/

## Stack

- React 18 (UMD)
- Babel Standalone (in-browser JSX transform)
- Plain HTML/CSS — no build step
- Hosted on GitHub Pages

## Design

"Cabanyal" direction: a light lime-wash ground, a Swiss 12-column grid and footnotes in the margin, set in Schibsted Grotesk with Instrument Serif italic accents. The one ornament is a band of simplified rajoles after the tiled façades of El Cabanyal, Valencia's old fishing quarter; it flips as one, cycling Flor → Estrella → Rombe → Cenefa → Ona. The mark is a minimal rosa dels vents. On scroll, section rules draw in, rows and cards rise in staggered, key figures count up and a thin progress line tracks the page. All motion respects `prefers-reduced-motion`.

Content order: hero and key facts → Work → AI in practice → Stack → Education & certifications → Contact.

## Structure

```
index.html              # Entry; loads React + mounts <CabanyalPortfolio />
portfolios/
  data.js               # Content (facts, experience, AI, skills, projects, etc.)
  cabanyal.jsx          # CabanyalPortfolio component, tile band, rosa mark
  cabanyal.css          # Layout, grid, motion and responsive styles
tests/                  # Node assertion scripts (node tests/<file>.mjs)
```

## Local development

Open `index.html` over a static server (file:// breaks `<script src>` in some browsers):

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Edit `portfolios/data.js` to update content. Edit `portfolios/cabanyal.jsx` and `portfolios/cabanyal.css` to change layout.

## Deployment

Pushes to `main` deploy automatically via GitHub Pages (root `/`).

## License

Content © Victor Esteban. Code MIT.
