// Renders the public-sector services page in each language to static HTML:
//
//   node administraciones/build.mjs
//
// es → administraciones/index.html, va → administraciones/va/index.html,
// en → administraciones/en/index.html, each with a gracias/ page the
// contact form lands on. Copy lives in strings.mjs; edit it
// (or the markup below) and rebuild. tests/administraciones.test.mjs fails
// if the committed pages are out of date.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LANGS, STRINGS } from './strings.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://victoresteban.com/';
const EMAIL = 'hola@victoresteban.com';
const LINKEDIN = 'https://www.linkedin.com/in/victorestebann';
// The Cloudflare Worker in workers/contacto receives the form and emails it.
export const FORM_ACTION = 'https://forms.victoresteban.com/contacto';
const ROSA = 'M32.00 2.00 L33.22 29.04 L41.19 22.81 L34.96 30.78 L62.00 32.00 L34.96 33.22 L41.19 41.19 L33.22 34.96 L32.00 62.00 L30.78 34.96 L22.81 41.19 L29.04 33.22 L2.00 32.00 L29.04 30.78 L22.81 22.81 L30.78 29.04 Z';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Text between *asterisks* is set in the serif italic.
const serif = (s) => esc(s).split('*').map((part, i) => (i % 2 ? `<span class="serif">${part}</span>` : part)).join('');
const mailto = (subject) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;
const pageUrl = (lang, page = '') => `${SITE}administraciones/${LANGS[lang].dir}${page}`;
const rosa = (cls) => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true"><path fill="var(--sea)" d="${ROSA}" /></svg>`;

// Head, header and footer shared by every page; `page` is '' for the
// services page and 'gracias/' for the thank-you page.
function layout(lang, page, { title, description, noindex = false }, main) {
  const t = STRINGS[lang];
  const meta = LANGS[lang];
  const depth = 1 + (meta.dir ? 1 : 0) + (page ? 1 : 0);
  const root = '../'.repeat(depth);
  const assets = `${root}assets/`;
  const own = `${root}administraciones/`;
  const portfolio = lang === 'en' ? root : `${root}?lang=es`;
  const home = page ? `${own}${meta.dir}` : '';

  const alternates = noindex ? '<meta name="robots" content="noindex" />' : Object.keys(LANGS)
    .map((l) => `<link rel="alternate" hreflang="${LANGS[l].hreflang}" href="${pageUrl(l)}" />`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${pageUrl('es')}" />`)
    .join('\n');

  const switcher = Object.keys(LANGS).map((l, i) => {
    const sep = i > 0 ? '<span class="lang-sep" aria-hidden="true">/</span>' : '';
    const href = `${own}${LANGS[l].dir}${page}`;
    const current = l === lang ? ' is-on" aria-current="page' : '';
    return `${sep}<a class="lang-opt${current}" href="${href}" lang="${LANGS[l].htmlLang}" hreflang="${LANGS[l].hreflang}" title="${LANGS[l].name}">${LANGS[l].label}</a>`;
  }).join('');

  return `<!doctype html>
<html lang="${meta.htmlLang}">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="${esc(description)}" />
<meta name="theme-color" content="#F7F5EF" />
<link rel="canonical" href="${pageUrl(lang, page)}" />
${alternates}

<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${SITE}assets/apple-touch-icon.png" />
<meta property="og:url" content="${pageUrl(lang, page)}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="${meta.locale}" />

<link rel="icon" href="${assets}favicon.ico" sizes="any" />
<link rel="icon" href="${assets}favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="${assets}apple-touch-icon.png" />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="${root}portfolios/cabanyal.css?v=10" />
<link rel="stylesheet" href="${own}administraciones.css?v=6" />
</head>
<body>
<a class="skip" href="#contenido">${esc(t.skip)}</a>

<header id="top" class="site-header anim-fade">
  <div class="wrap">
    <div class="grid">
      <a href="${portfolio}" class="brand" aria-label="${esc(t.brandLabel)}">
        ${rosa('brand-mark anim-spin')}
        <span>Victor Esteban</span>
      </a>
      <span class="header-role muted">${esc(t.headerRole)}</span>
      <nav class="nav" aria-label="${esc(t.sectionsLabel)}">
        <a class="link" href="${home}#servicios">${esc(t.navServices)}</a>
        <a class="link" href="${home}#como-trabajo">${esc(t.navHow)}</a>
        <span class="lang" role="group" aria-label="${esc(t.languageLabel)}">${switcher}</span>
        <a class="btn btn-sm" href="${home}#contacto">${esc(t.navDemo)}</a>
      </nav>
    </div>
  </div>
</header>

${main({ root, assets, own, portfolio })}

<footer class="wrap">
  <div class="site-footer">
    <span class="left">
      ${rosa('brand-mark')}
      <span>© 2026 Victor Esteban</span>
    </span>
    <a class="link" href="#top">${esc(t.backToTop)}</a>
  </div>
</footer>
</body>
</html>
`;
}

function contactForm(lang) {
  const f = STRINGS[lang].form;
  const optional = `<span class="opt">(${esc(f.optional)})</span>`;
  const input = (id, name, label, attrs, opt = false) => `        <div class="field">
          <label for="${id}">${esc(label)}${opt ? ` ${optional}` : ''}</label>
          <input id="${id}" name="${name}" ${attrs} />
        </div>`;
  const interests = f.interests.map(([value, label]) => `          <label class="check"><input type="checkbox" name="interes" value="${value}" /> <span>${esc(label)}</span></label>`).join('\n');
  const privacy = f.privacy.map(([k, v]) => `          <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n');
  return `    <form class="form" action="${FORM_ACTION}" method="post" accept-charset="utf-8">
      <input type="hidden" name="lang" value="${lang}" />
${input('f-nombre', 'nombre', f.name, 'type="text" required maxlength="200" autocomplete="name"')}
      <div class="field-row">
${input('f-organismo', 'organismo', f.org, `type="text" required maxlength="200" autocomplete="organization" placeholder="${esc(f.orgPlaceholder)}"`)}
${input('f-cargo', 'cargo', f.role, 'type="text" maxlength="200" autocomplete="organization-title"', true)}
      </div>
      <div class="field-row">
${input('f-email', 'email', f.email, 'type="email" required maxlength="200" autocomplete="email"')}
${input('f-telefono', 'telefono', f.phone, 'type="tel" maxlength="40" autocomplete="tel"', true)}
      </div>
      <fieldset class="field checks">
        <legend>${esc(f.interest)} ${optional}</legend>
        <div class="check-grid">
${interests}
        </div>
      </fieldset>
      <div class="field">
        <label for="f-mensaje">${esc(f.message)} ${optional}</label>
        <textarea id="f-mensaje" name="mensaje" rows="4" maxlength="5000" placeholder="${esc(f.messagePlaceholder)}"></textarea>
      </div>
      <div class="hp" aria-hidden="true">
        <label for="f-web">${esc(f.honeypot)}</label>
        <input id="f-web" name="web" type="text" tabindex="-1" autocomplete="off" />
      </div>
      <label class="check consent"><input type="checkbox" name="privacidad" value="si" required /> <span>${esc(f.consent)}</span></label>
      <details class="privacy">
        <summary>${esc(f.privacyTitle)}</summary>
        <dl>
${privacy}
        </dl>
      </details>
      <button class="btn" type="submit">${esc(f.submit)}</button>
    </form>`;
}

export function renderPage(lang) {
  const t = STRINGS[lang];
  const demo = mailto(t.demoSubject);
  return layout(lang, '', { title: t.title, description: t.description }, ({ assets, portfolio }) => {
    const sheet = t.sheet.map(([k, v]) => `        <div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n');

    const cards = t.services.map((s) => `      <article class="card">
        <img class="card-tile" src="${assets}rajoles/${s.tile}.svg" alt="" width="48" height="48" />
        <span class="tag">${esc(s.tag)}</span>
        <h3>${esc(s.name)}</h3>
        <p class="card-for">${esc(s.audience)}</p>
        <p>${esc(s.problem)}</p>
        <h4>${esc(t.deliverables)}</h4>
        <ul>
${s.items.map((it) => `          <li>${esc(it)}</li>`).join('\n')}
        </ul>${s.variant ? `
        <div class="variant">
          <span class="variant-label">${esc(s.variant.label)}</span>
          <p><b>${esc(s.variant.name)}</b> ${esc(s.variant.text)}</p>
        </div>` : ''}
      </article>`).join('\n\n');

    const steps = t.steps.map(([h, p], i) => `      <li><span class="step-n serif">${i + 1}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join('\n');
    const principles = t.principles.map(([b, p]) => `      <li><b>${esc(b)}</b> ${esc(p)}</li>`).join('\n');

    return `<main id="contenido">
  <section class="intro wrap" aria-label="${esc(t.introLabel)}">
    <div class="intro-text">
      <p class="eyebrow anim-fade">${esc(t.eyebrow)}</p>
      <h1 class="anim-lift" style="animation-delay: 120ms">${serif(t.headline)}</h1>
      <p class="lede anim-fade" style="animation-delay: 300ms">${esc(t.lede)}</p>
      <div class="actions anim-fade" style="animation-delay: 450ms">
        <a class="btn" href="#contacto">${esc(t.ctaDemo)}</a>
        <a class="link" href="#servicios">${esc(t.ctaServices)}</a>
      </div>
    </div>

    <aside class="ficha anim-fade" style="animation-delay: 550ms" aria-labelledby="ficha-titulo">
      <div class="ficha-head">
        <h2 id="ficha-titulo" class="ficha-title">${esc(t.sheetTitle)}</h2>
        <span class="stamp">${esc(t.stamp)}</span>
      </div>
      <dl>
${sheet}
      </dl>
    </aside>
  </section>

  <div class="band" aria-hidden="true"></div>

  <section id="servicios" class="block wrap" aria-labelledby="servicios-titulo">
    <div class="block-head">
      <p class="eyebrow">${esc(t.servicesEyebrow)}</p>
      <h2 id="servicios-titulo">${serif(t.servicesTitle)}</h2>
    </div>

    <div class="cards">
${cards}
    </div>

    <aside class="taller" aria-labelledby="taller-titulo">
      <img class="taller-tile" src="${assets}rajoles/ona.svg" alt="" width="64" height="64" />
      <div class="taller-text">
        <p class="taller-kicker serif">${esc(t.workshopKicker)}</p>
        <h3 id="taller-titulo">${esc(t.workshopTitle)}</h3>
        <p>${esc(t.workshopText)}</p>
      </div>
      <div class="taller-side">
        <span>${esc(t.workshopMeta)}</span>
        <a class="btn btn-light" href="#contacto">${esc(t.workshopCta)}</a>
      </div>
    </aside>
  </section>

  <section id="como-trabajo" class="block wrap" aria-labelledby="como-titulo">
    <div class="block-head">
      <p class="eyebrow">${esc(t.howEyebrow)}</p>
      <h2 id="como-titulo">${serif(t.howTitle)}</h2>
    </div>
    <ol class="steps">
${steps}
    </ol>
    <ul class="principles">
${principles}
    </ul>
  </section>

  <div class="wrap pair">
    <section id="demos" class="panel" aria-labelledby="demos-titulo">
      <p class="eyebrow">${esc(t.demosEyebrow)}</p>
      <h2 id="demos-titulo">${esc(t.demosTitle)}</h2>
      <!-- When the videos exist, replace the paragraph with one of these per demo:
      <figure class="demo">
        <video controls preload="metadata" src="${assets}demos/actas.mp4"></video>
        <figcaption>…</figcaption>
      </figure>
      -->
      <p>${esc(t.demosText)}</p>
      <a class="link link-on" href="#contacto">${esc(t.demosCta)}</a>
    </section>

    <section id="datos" class="panel" aria-labelledby="datos-titulo">
      <p class="eyebrow">${esc(t.dataEyebrow)}</p>
      <h2 id="datos-titulo">${esc(t.dataTitle)}</h2>
      <p>${esc(t.dataText)}</p>
      <!-- When the PDF exists, link it here with the download attribute. -->
      <a class="link link-on" href="#contacto">${esc(t.dataCta)}</a>
    </section>
  </div>

  <section id="quien" class="block wrap who" aria-labelledby="quien-titulo">
    ${rosa('who-mark')}
    <div>
      <p class="eyebrow" id="quien-titulo">${esc(t.whoEyebrow)}</p>
      <p class="who-text">${esc(t.whoText)}</p>
      <a class="link link-on" href="${portfolio}">${esc(t.whoLink)}</a>
      <a class="link link-on" href="${assets}${LANGS[lang].cv}">${esc(t.whoCv)}</a>
    </div>
  </section>

  <section id="contacto" class="closing" aria-labelledby="contacto-titulo">
    <div class="band band-cenefa" aria-hidden="true"></div>
    <div class="wrap closing-inner">
      <div class="closing-intro">
        <h2 id="contacto-titulo">${serif(t.closingTitle)}</h2>
        <p class="closing-lead">${esc(t.contactLead)}</p>
        <a class="closing-mail" href="${demo}">${EMAIL}</a>
        <p class="muted closing-place">${esc(t.closingPlace)} · <a class="link" href="${LINKEDIN}" target="_blank" rel="noreferrer">LinkedIn ↗</a></p>
      </div>
${contactForm(lang)}
    </div>
  </section>
</main>`;
  });
}

export function renderThanks(lang) {
  const t = STRINGS[lang];
  return layout(lang, 'gracias/', { title: t.thanksTitle, description: t.description, noindex: true }, ({ assets, own }) => `<main id="contenido">
  <section class="thanks wrap" aria-labelledby="gracias-titulo">
    <img class="thanks-tile" src="${assets}rajoles/estrella.svg" alt="" width="64" height="64" />
    <h1 id="gracias-titulo">${serif(t.thanksHeading)}</h1>
    <p class="lede">${esc(t.thanksText)}</p>
    <a class="btn" href="${own}${LANGS[lang].dir}">${esc(t.thanksBack)}</a>
  </section>
  <div class="band band-cenefa" aria-hidden="true"></div>
</main>`);
}

export const outputPath = (lang, page = '') => path.join(here, LANGS[lang].dir, page, 'index.html');
export const PAGES = [['', renderPage], ['gracias/', renderThanks]];

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const lang of Object.keys(LANGS)) {
    for (const [page, render] of PAGES) {
      const out = outputPath(lang, page);
      mkdirSync(path.dirname(out), { recursive: true });
      writeFileSync(out, render(lang));
      console.log(`${lang} → ${path.relative(path.join(here, '..'), out)}`);
    }
  }
}
