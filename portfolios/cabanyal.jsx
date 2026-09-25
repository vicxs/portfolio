// Cabanyal: light, Swiss grid, footnotes in the margin, and a band of
// rajoles after the tiled façades of El Cabanyal that flips as one.
// Styles live in cabanyal.css; content in data.js.

const { useState, useEffect, useRef } = React;

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

function SectionHead({ n, title }) {
  return (
    <header className="sec-head rv">
      <span className="serif">{n}</span>
      <h2>{title}</h2>
    </header>
  );
}

function CabanyalPortfolio() {
  const v = window.VICTOR;
  const [activeNote, setActiveNote] = useState(null);

  // Reveal items as they scroll into view. Items entering together are
  // staggered so rows, cards and list entries cascade instead of popping.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.rv'));
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
  }, []);

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
  const pad = (i) => String(i + 1).padStart(2, '0');
  const preparing = 'Currently preparing — ';

  return (
    <>
      <TileDefs />
      <div className="progress" aria-hidden="true"></div>

      <div id="top" className="site-header anim-fade">
        <div className="wrap">
          <div className="grid">
            <a href="#top" className="brand" aria-label="Victor Esteban, back to top">
              <RosaMark className="brand-mark anim-spin" />
              <span>{v.name}</span>
            </a>
            <span className="header-role muted">{v.role}</span>
            <span className="header-place muted">Valencia, by the sea</span>
            <nav className="nav" aria-label="Sections">
              <a className="link" href="#work">Work</a>
              <a className="link" href="#stack">Stack</a>
              <a className="link" href="#contact">Contact</a>
              <a className="link" href={v.cvUrl}>CV</a>
            </nav>
          </div>
        </div>
      </div>

      <main>
        <section className="hero wrap" aria-label="Introduction">
          <div className="grid">
            <h1>
              <span className="ln"><span className="anim-rise" style={{ animationDelay: '150ms' }}>I design, build and run</span></span>{' '}
              <span className="ln"><span className="anim-rise" style={{ animationDelay: '240ms' }}>software people can <span className="wave">rely on</span>,</span></span>{' '}
              <span className="ln"><span className="anim-rise" style={{ animationDelay: '330ms' }}>and use AI to deliver</span></span>{' '}
              <span className="ln"><span className="anim-rise" style={{ animationDelay: '420ms' }}>more value.</span></span>
            </h1>
            <p className="hero-lede anim-fade" style={{ animationDelay: '700ms' }}>{v.lede}</p>
            <div className="hero-links anim-fade" style={{ animationDelay: '900ms' }}>
              <a className="link link-on" href={v.linkedinUrl} target="_blank" rel="noreferrer">Get in touch on LinkedIn ↗</a>
              <a className="link" href={v.cvUrl}>Download CV</a>
            </div>
          </div>
        </section>

        <TileBand />

        <section id="work" className="section wrap">
          <SectionHead n="01" title="Work" />
          <div className="grid table-head rv" aria-hidden="true">
            <span className="c-period">Period</span>
            <span className="c-company">Company</span>
            <span className="c-what">What I did</span>
            <span className="c-notes">Notes</span>
          </div>
          {main.map((exp, i) => {
            const n = exp.note ? noteNumber(exp) : 0;
            return (
              <article key={exp.company} className={`grid row rv${i === 0 ? ' first' : ''}`}>
                <span className="c-period">
                  {exp.period.includes('Present') && <span className="live" aria-hidden="true"></span>}
                  {exp.period}
                </span>
                <div className="c-company">
                  <h3 className="co" style={{ margin: 0 }}>{exp.client || exp.company}</h3>
                  <span className="sub">{exp.client ? `via ${exp.company}` : exp.domain}</span>
                </div>
                <div className="c-what">
                  <p>
                    {exp.summary}
                    {n > 0 && (
                      <a href={`#note-${n}`} className={`fn${activeNote === n ? ' is-on' : ''}`}
                        aria-label={`Note ${n}`} {...noteHandlers(n)}>{n}</a>
                    )}
                  </p>
                  <details className="contrib">
                    <summary><span className="plus" aria-hidden="true">+</span>Contributions ({exp.bullets.length})</summary>
                    <ul>{exp.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
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
              <span className="c-period muted">{exp.period}</span>
              <div className="c-company">
                <span className="co">{exp.company}</span>
                <span className="sub">{exp.role}</span>
              </div>
              <p className="c-what" style={{ margin: 0 }}>{exp.summary}</p>
            </div>
          ))}
          {earlier.length > 0 && (
            <div className="grid row row-earlier last rv">
              <span className="c-period muted">{earlierSpan}</span>
              <div className="c-company">
                <span className="co">Earlier experience</span>
                <span className="sub">{earlier.length} roles</span>
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

        <section id="stack" className="section wrap">
          <SectionHead n="02" title="Stack" />
          {v.skills.map((g, i) => (
            <div key={g.group} className={`grid stack-row rv${i === 0 ? ' first' : ''}${i === v.skills.length - 1 ? ' last' : ''}`}>
              <span className="g">{g.group}</span>
              <span className="items">{g.items.map((it) => <span key={it}>{it}</span>)}</span>
            </div>
          ))}
        </section>

        <section id="credentials" className="section wrap">
          <SectionHead n="03" title="Education & certifications" />
          <div className="grid creds">
            <span className="label rv" style={{ gridColumn: '1 / span 3' }}>Certifications</span>
            <ul className="certs rv">
              {v.certifications.map((c) => (
                c.startsWith(preparing)
                  ? <li key={c} className="prep">{c.slice(preparing.length)} <span className="serif">— in preparation</span></li>
                  : <li key={c}>{c}</li>
              ))}
            </ul>
            <div className="edu rv">
              <span className="label">Education</span>
              <span className="school">{v.education.school}</span>
              <span>{v.education.degree}</span>
              <span className="muted">{v.education.track}</span>
            </div>
          </div>
        </section>

        <section id="contact" className="section wrap contact">
          <SectionHead n="04" title="Contact" />
          <div className="grid">
            <h2 className="contact-title rv">Looking for a software engineer who owns production and builds with AI, <span className="wave">safely</span>?</h2>
          </div>
          <div className="grid contact-links">
            {[
              { k: 'LinkedIn', val: v.linkedin, href: v.linkedinUrl, external: true },
              { k: 'GitHub', val: v.github, href: v.githubUrl, external: true },
              { k: 'Location', val: v.location },
            ].map(({ k, val, href, external }) => (
              <div key={k} className="contact-cell rv">
                <span className="label">{k}</span>
                {external
                  ? <a className="val link" href={href} target="_blank" rel="noreferrer">{val}</a>
                  : <span className="val">{val}</span>}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="wrap">
        <div className="site-footer">
          <span className="left"><RosaMark className="brand-mark" /><span>© {new Date().getFullYear()} {v.name} · Built with Claude Code</span></span>
          <a className="link" href="#top">Back to top ↑</a>
        </div>
      </footer>
    </>
  );
}

window.CabanyalPortfolio = CabanyalPortfolio;
