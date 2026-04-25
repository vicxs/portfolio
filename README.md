# Portfolio — Victor Esteban

Personal portfolio site. Software Engineer · Backend / Integration / Production.

**Live:** https://vicxs.github.io/portfolio/

## Stack

- React 18 (UMD)
- Babel Standalone (in-browser JSX transform)
- Plain HTML/CSS — no build step
- Hosted on GitHub Pages

## Design

Engineering Minimal direction (Option C from Claude Design exploration). Dark, hairline grid, Inter + JetBrains Mono, single teal accent. Sections: about, strengths, stack, selected work, personal projects, credentials, contact.

## Structure

```
index.html              # Entry; loads React + mounts <SystemsPortfolio />
portfolios/
  data.js               # Content (experience, skills, projects, etc.)
  systems.jsx           # SystemsPortfolio component
```

## Local development

Open `index.html` over a static server (file:// breaks `<script src>` in some browsers):

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Edit `portfolios/data.js` to update content. Edit `portfolios/systems.jsx` to change layout.

## Deployment

Pushes to `main` deploy automatically via GitHub Pages (root `/`).

## License

Content © Victor Esteban. Code MIT.
