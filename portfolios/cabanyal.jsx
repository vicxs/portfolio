// Cabanyal: light, Swiss grid, footnotes in the margin, and a band of
// rajoles after the tiled façades of El Cabanyal that flips as one.
// Styles live in cabanyal.css; content in data.js; interface copy in i18n.js.

const { useState, useEffect, useRef } = React;

// English by default; ?lang=es or a remembered choice switches to Spanish.
const LANGS = ['en', 'es'];
const DEFAULT_LANG = 'en';

function initialLang() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (LANGS.includes(q)) return q;
  } catch (e) { /* no query string access */ }
  try {
    const saved = window.localStorage.getItem('lang');
    if (LANGS.includes(saved)) return saved;
  } catch (e) { /* storage blocked */ }
  return DEFAULT_LANG;
}

// Keep the address shareable: ?lang=es in Spanish, clean URL in English.
function persistLang(lang) {
  try { window.localStorage.setItem('lang', lang); } catch (e) { /* storage blocked */ }
  try {
    const url = new URL(window.location.href);
    if (lang === DEFAULT_LANG) url.searchParams.delete('lang');
    else url.searchParams.set('lang', lang);
    window.history.replaceState(null, '', url);
  } catch (e) { /* history unavailable */ }
}

// Resolve an { en, es } pair to the current language; plain values pass through.
function tr(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value) && DEFAULT_LANG in value) {
    return value[lang] ?? value[DEFAULT_LANG];
  }
  return value;
}

// Text between *asterisks* is set in the serif italic.
function withSerif(text) {
  return text.split('*').map((part, i) => (i % 2 ? <span key={i} className="serif">{part}</span> : part));
}

function LangSwitch({ lang, onChange, label }) {
  return (
    <span className="lang" role="group" aria-label={label}>
      {LANGS.map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && <span className="lang-sep" aria-hidden="true">/</span>}
          <button type="button" lang={l} className={`lang-opt${lang === l ? ' is-on' : ''}`}
            aria-pressed={lang === l} onClick={() => onChange(l)}>{l.toUpperCase()}</button>
        </React.Fragment>
      ))}
    </span>
  );
}

const TILE_SEQUENCE = ['flor', 'estrella', 'rombe', 'cenefa', 'ona'];
const TILE_SIZE = 64;
const FLIP_MS = 1000;
const REST_MS = 3500;

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

// Eight-point wind rose: long points N/E/S/W, short diagonals.
function rosaPath(cx = 32, cy = 32, long = 30, short = 13, inner = 3.2) {
  const pts = [];
  for (let k = 0; k < 16; k++) {
    const ang = (-90 + 22.5 * k) * Math.PI / 180;
    const r = k % 4 === 0 ? long : k % 2 === 0 ? short : inner;
    pts.push(`${(cx + r * Math.cos(ang)).toFixed(2)} ${(cy + r * Math.sin(ang)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}
const ROSA = rosaPath();

function RosaMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d={ROSA} fill="var(--sea)" />
    </svg>
  );
}

// Simplified rajoles. Each motif is complete inside its tile vertically and
// joins its neighbours left and right, so a single row reads as a frieze.
function TileDefs() {
  const c1 = '#1E5B8C', c2 = '#2E6E5A', c3 = '#D39A35', g = '#FBF8F1';
  const grout = <path d="M0.5 0 V64" stroke="#131A1C" strokeOpacity="0.08" strokeWidth="1" />;
  const stripes = (
    <>
      <rect x="0" y="0" width="64" height="3" fill={c1} />
      <rect x="0" y="61" width="64" height="3" fill={c1} />
    </>
  );
  const tile = (id, body) => (
    <pattern id={`b-${id}`} width="64" height="64" patternUnits="userSpaceOnUse">
      <rect width="64" height="64" fill={g} />
      {body}
      {grout}
    </pattern>
  );
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        {tile('flor', <>
          {stripes}
          <circle cx="0" cy="32" r="8" fill={c2} /><circle cx="64" cy="32" r="8" fill={c2} />
          <circle cx="0" cy="32" r="3" fill={c3} /><circle cx="64" cy="32" r="3" fill={c3} />
          <g fill={c1}>
            <ellipse cx="32" cy="20" rx="5.5" ry="9" /><ellipse cx="44" cy="32" rx="9" ry="5.5" />
            <ellipse cx="32" cy="44" rx="5.5" ry="9" /><ellipse cx="20" cy="32" rx="9" ry="5.5" />
          </g>
          <g fill={c2}>
            <circle cx="43" cy="21" r="2.6" /><circle cx="43" cy="43" r="2.6" />
            <circle cx="21" cy="43" r="2.6" /><circle cx="21" cy="21" r="2.6" />
          </g>
          <circle cx="32" cy="32" r="5" fill={c3} /><circle cx="32" cy="32" r="1.8" fill={g} />
        </>)}
        {tile('estrella', <>
          {stripes}
          <g fill={c3}><path d="M0 22 L10 32 L0 42 Z" /><path d="M64 22 L54 32 L64 42 Z" /></g>
          <g fill={c2}>
            <circle cx="9" cy="11" r="2" /><circle cx="55" cy="11" r="2" />
            <circle cx="9" cy="53" r="2" /><circle cx="55" cy="53" r="2" />
          </g>
          <g fill={c1}>
            <rect x="19" y="19" width="26" height="26" />
            <rect x="19" y="19" width="26" height="26" transform="rotate(45 32 32)" />
          </g>
          <rect x="26" y="26" width="12" height="12" fill={g} transform="rotate(45 32 32)" />
          <circle cx="32" cy="32" r="3.5" fill={c2} />
        </>)}
        {tile('rombe', <>
          {stripes}
          <path d="M32 8 L57 32 L32 56 L7 32 Z" fill="none" stroke={c2} strokeWidth="2.5" />
          <path d="M32 18 L46 32 L32 46 L18 32 Z" fill={c1} />
          <circle cx="32" cy="32" r="3.5" fill={c3} />
          <circle cx="0" cy="32" r="4" fill={c3} /><circle cx="64" cy="32" r="4" fill={c3} />
        </>)}
        {tile('cenefa', <>
          <rect x="0" y="0" width="64" height="6" fill={c1} /><rect x="0" y="58" width="64" height="6" fill={c1} />
          <rect x="0" y="10" width="64" height="2" fill={c3} /><rect x="0" y="52" width="64" height="2" fill={c3} />
          <circle cx="0" cy="32" r="9" fill={c1} /><circle cx="64" cy="32" r="9" fill={c1} />
          <circle cx="32" cy="32" r="11" fill={c2} /><circle cx="32" cy="32" r="4.5" fill={c3} />
          <circle cx="16" cy="32" r="2.5" fill={c3} /><circle cx="48" cy="32" r="2.5" fill={c3} />
        </>)}
        {tile('ona', <>
          <rect x="0" y="0" width="64" height="3" fill={c1} />
          <rect x="0" y="50" width="64" height="6" fill={c1} />
          <rect x="0" y="57.5" width="64" height="1.5" fill={c3} />
          <rect x="0" y="61" width="64" height="3" fill={c1} />
          <path d="M0 50 C14 50 14 16 32 16 A14 14 0 0 1 32 44 A10 10 0 0 1 32 24 A6 6 0 0 1 32 36 A3 3 0 0 1 32 30"
            fill="none" stroke={c1} strokeWidth="3" strokeLinecap="round" />
          <circle cx="54" cy="42" r="2.2" fill={c3} /><circle cx="49" cy="46.5" r="1.4" fill={c3} />
        </>)}
      </defs>
    </svg>
  );
}

// The band flips as one: a wave runs left to right and every tile turns to
// the same next design. Two faces per tile; the hidden face is repainted
// with the following design only once the wave has fully passed.
function TileBand() {
  const boxRef = useRef(null);
  const [count, setCount] = useState(() => Math.ceil(window.innerWidth / TILE_SIZE) + 1);
  const [turn, setTurn] = useState(0);      // drives rotation
  const [painted, setPainted] = useState(0); // drives which designs the faces hold

  useEffect(() => {
    const onResize = () => setCount(Math.ceil(window.innerWidth / TILE_SIZE) + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const stagger = Math.min(90, 1800 / count);
  const waveMs = count * stagger + FLIP_MS + 200;

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let visible = true;
    let n = 0;
    const timers = [];
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; })
      : null;
    if (io && boxRef.current) io.observe(boxRef.current);
    const tick = () => {
      if (visible && !document.hidden) {
        n += 1;
        const step = n;
        setTurn(step);
        timers.push(setTimeout(() => setPainted(step), waveMs));
      }
    };
    const id = setInterval(tick, waveMs + REST_MS);
    return () => {
      clearInterval(id);
      timers.forEach(clearTimeout);
      if (io) io.disconnect();
    };
  }, [waveMs]);

  const design = (i) => `url(#b-${TILE_SEQUENCE[i % TILE_SEQUENCE.length]})`;
  const faceA = painted % 2 === 0 ? design(painted) : design(painted + 1);
  const faceB = painted % 2 === 0 ? design(painted + 1) : design(painted);

  return (
    <div className="bandbox" ref={boxRef} aria-hidden="true">
      <div className="track">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="laid anim-laid" style={{ animationDelay: `${500 + Math.min(i, 24) * 45}ms` }}>
            <div className="cell" style={{ transform: `rotateY(${turn * 180}deg)`, transitionDelay: `${i * stagger}ms` }}>
              <div className="face">
                <svg viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" fill={faceA} /></svg>
              </div>
              <div className="face back">
                <svg viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" fill={faceB} /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Extra children (column labels) turn the head into a grid row on the section rule.
function SectionHead({ n, title, children }) {
  return (
    <header className={`sec-head rv${children ? ' grid sec-head-cols' : ''}`}>
      <span className="sh-title">
        <span className="serif">{n}</span>
        <h2>{title}</h2>
      </span>
      {children}
    </header>
  );
}

function CabanyalPortfolio() {
  const data = window.VICTOR;
  const [lang, setLang] = useState(initialLang);
  const [activeNote, setActiveNote] = useState(null);
  const t = window.STRINGS[lang];

  // Resolve every { en, es } pair once, so the markup reads plain values.
  const v = {
    ...data,
    location: tr(data.location, lang),
    lede: tr(data.lede, lang),
    facts: data.facts.map((f) => ({ ...f, label: tr(f.label, lang), value: tr(f.value, lang), sub: tr(f.sub, lang) })),
    experiences: data.experiences.map((e) => ({
      ...e,
      role: tr(e.role, lang),
      period: tr(e.period, lang),
      domain: tr(e.domain, lang),
      summary: tr(e.summary, lang),
      note: tr(e.note, lang),
      bullets: tr(e.bullets, lang),
    })),
    skills: data.skills.map((g) => ({ group: tr(g.group, lang), items: g.items.map((it) => tr(it, lang)) })),
    certifications: data.certifications.map((c) => ({ ...c, name: tr(c.name, lang) })),
    languages: data.languages.map((l) => ({ name: tr(l.name, lang), detail: tr(l.detail, lang) })),
    education: {
      school: data.education.school,
      degree: tr(data.education.degree, lang),
      track: tr(data.education.track, lang),
    },
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang]);

  const changeLang = (next) => {
    setLang(next);
    persistLang(next);
  };

  // Reveal items as they scroll into view. Items entering together are
  // staggered so rows, cards and list entries cascade instead of popping.
  // Re-runs on a language switch to pick up anything newly mounted.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.rv:not(.is-in)'));
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const timers = [];
    const io = new IntersectionObserver((entries) => {
      let k = 0;
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const delay = Math.min(k, 6) * 90;
        k += 1;
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('is-in');
        io.unobserve(el);
        // Drop the delay once in, so hover transitions stay instant.
        timers.push(setTimeout(() => { el.style.transitionDelay = ''; }, delay + 1100));
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, [lang]);

  const main = v.experiences.filter((e) => e.tier === 'main');
  const secondary = v.experiences.filter((e) => e.tier === 'secondary');
  const earlier = v.experiences.filter((e) => e.tier === 'earlier');
  const earlierSpan = earlier.length
    ? `${earlier[earlier.length - 1].period.split(' — ')[0]} — ${earlier[0].period.split(' — ')[1]}`
    : '';
  const noted = main.filter((e) => e.note);
  const noteNumber = (exp) => noted.indexOf(exp) + 1;
  const noteHandlers = (n) => ({
    onMouseEnter: () => setActiveNote(n),
    onMouseLeave: () => setActiveNote(null),
    onFocus: () => setActiveNote(n),
    onBlur: () => setActiveNote(null),
  });

  return (
    <>
      <TileDefs />
      <div className="progress" aria-hidden="true"></div>

      <div id="top" className="site-header anim-fade">
        <div className="wrap">
          <div className="grid">
            <a href="#top" className="brand" aria-label={t.backToTopLabel}>
              <RosaMark className="brand-mark anim-spin" />
              <span>{v.name}</span>
            </a>
            <span className="header-role muted">{v.role}</span>
            <span className="header-place muted">{t.place}</span>
            <nav className="nav" aria-label={t.sectionsLabel}>
              <a className="link" href="#work">{t.navWork}</a>
              <a className="link" href="#stack">{t.navStack}</a>
              <a className="link" href="#contact">{t.navContact}</a>
              <a className="link" href={v.cvUrl}>{t.navCv}</a>
              <LangSwitch lang={lang} onChange={changeLang} label={t.languageLabel} />
            </nav>
          </div>
        </div>
      </div>

      <main>
        <section className="hero wrap" aria-label={t.introLabel}>
          <div className="grid">
            <h1>
              {t.hero.map((line, i) => (
                <React.Fragment key={i}>
                  {i > 0 && ' '}
                  <span className="ln"><span className="anim-rise" style={{ animationDelay: `${150 + i * 90}ms` }}>{withSerif(line)}</span></span>
                </React.Fragment>
              ))}
            </h1>
            <p className="hero-lede anim-fade" style={{ animationDelay: '700ms' }}>{v.lede}</p>
            <div className="hero-links anim-fade" style={{ animationDelay: '900ms' }}>
              <a className="link link-on" href={v.linkedinUrl} target="_blank" rel="noreferrer">{t.linkedinCta}</a>
              <a className="link" href={v.cvUrl}>{t.downloadCv}</a>
            </div>
            <dl className="hero-facts anim-fade" style={{ animationDelay: '1000ms' }} aria-label={t.factsLabel}>
              {v.facts.map((f) => (
                <div key={f.label} className="fact">
                  <dt className="label">{f.label}</dt>
                  <dd>
                    <span className="fact-v">{f.live && <span className="live" aria-hidden="true"></span>}{f.value}</span>
                    {f.sub && <span className="fact-sub muted">{f.sub}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <TileBand />

        <section id="work" className="section wrap">
          <SectionHead n="01" title={t.work}>
            <span className="c-what label" aria-hidden="true">{t.colWhat}</span>
            <span className="c-notes label" aria-hidden="true">{t.colNotes}</span>
          </SectionHead>
          {main.map((exp, i) => {
            const n = exp.note ? noteNumber(exp) : 0;
            return (
              <article key={exp.company} className={`grid row rv${i === 0 ? ' first' : ''}`}>
                <div className="c-company">
                  <span className="per">
                    {exp.current && <span className="live" aria-hidden="true"></span>}
                    {exp.period}
                  </span>
                  <h3 className="co" style={{ margin: 0 }}>{exp.client || exp.company}</h3>
                  <span className="sub">{exp.client ? `${t.via} ${exp.company}` : exp.domain}</span>
                </div>
                <div className="c-what">
                  <p>
                    {exp.summary}
                    {n > 0 && (
                      <a href={`#note-${n}`} className={`fn${activeNote === n ? ' is-on' : ''}`}
                        aria-label={`${t.note} ${n}`} {...noteHandlers(n)}>{n}</a>
                    )}
                  </p>
                  <details className="contrib">
                    <summary><span className="plus" aria-hidden="true">+</span>{t.contributions} ({exp.bullets.length})</summary>
                    <ul>{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                  </details>
                </div>
                {n > 0 && (
                  <p id={`note-${n}`} className={`c-notes note${activeNote === n ? ' is-on' : ''}`} {...noteHandlers(n)}>
                    <b>{n}</b><span>{exp.note}</span>
                  </p>
                )}
              </article>
            );
          })}
          {secondary.map((exp, i) => (
            <div key={exp.company} className={`grid row row-earlier rv${!earlier.length && i === secondary.length - 1 ? ' last' : ''}`}>
              <div className="c-company">
                <span className="per">{exp.period}</span>
                <span className="co">{exp.company}</span>
                <span className="sub">{exp.role}</span>
              </div>
              <p className="c-what" style={{ margin: 0 }}>{exp.summary}</p>
            </div>
          ))}
          {earlier.length > 0 && (
            <div className="grid row row-earlier last rv">
              <div className="c-company">
                <span className="per">{earlierSpan}</span>
                <span className="co">{t.earlier}</span>
                <span className="sub">{earlier.length} {t.roles}</span>
              </div>
              <ul className="c-what earlier-list">
                {earlier.map((exp) => (
                  <li key={exp.company}>
                    <span className="earlier-co">{exp.company}</span>
                    <span className="muted"> · {exp.role}</span>
                    <span className="earlier-period">{exp.period}</span>
                    <span className="earlier-sum">{exp.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="wrap duo">
          <section id="stack" className="section">
            <SectionHead n="02" title={t.stack} />
            {v.skills.map((g, i) => (
              <div key={i} className={`grid stack-row rv${i === 0 ? ' first' : ''}${i === v.skills.length - 1 ? ' last' : ''}`}>
                <span className="g">{g.group}</span>
                <span className="items">{g.items.map((it, j) => <span key={j}>{it}</span>)}</span>
              </div>
            ))}
          </section>

          <section id="certifications" className="section">
            <SectionHead n="03" title={t.certifications} />
            <ul className="certs rv">
              {v.certifications.map((c, i) => (
                c.preparing
                  ? <li key={i} className="prep">{c.name} <span className="serif">{t.inPreparation}</span></li>
                  : <li key={i}>{c.name}</li>
              ))}
            </ul>
          </section>
        </div>

        <section id="education" className="section wrap">
          <SectionHead n="04" title={t.eduLang} />
          <div className="grid edu-row rv">
            <div className="edu-main">
              <span className="school">{v.education.school}</span>
              <span className="muted">{v.education.degree} · {v.education.track}</span>
            </div>
            <div className="langs">
              {v.languages.map((l) => (
                <React.Fragment key={l.name}>
                  <span className="school">{l.name}</span>
                  <span className="muted">{l.detail}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="section wrap contact">
          <SectionHead n="05" title={t.contact} />
          <div className="grid contact-duo">
            <h2 className="contact-title rv">{withSerif(t.contactTitle)}</h2>
            <div className="contact-stack">
              {[
                { k: 'LinkedIn', val: v.linkedin, href: v.linkedinUrl, external: true },
                { k: 'GitHub', val: v.github, href: v.githubUrl, external: true },
                { k: t.location, val: v.location },
              ].map(({ k, val, href, external }, i) => (
                <div key={i} className="contact-cell rv">
                  <span className="label">{k}</span>
                  {external
                    ? <a className="val link" href={href} target="_blank" rel="noreferrer">{val}</a>
                    : <span className="val">{val}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="wrap">
        <div className="site-footer">
          <span className="left"><RosaMark className="brand-mark" /><span>© {new Date().getFullYear()} {v.name}</span></span>
          <a className="link" href="#top">{t.backToTop}</a>
        </div>
      </footer>
    </>
  );
}

window.CabanyalPortfolio = CabanyalPortfolio;
