// Pure helpers for the contact Worker: read and check a submission, write
// the email, and build the responses. No Cloudflare APIs here, so the
// tests can run them under Node.

export const SITE = 'https://victoresteban.com';
export const ALLOWED_ORIGINS = ['https://victoresteban.com', 'https://www.victoresteban.com'];

const LANG_DIRS = { es: '', va: 'va/', en: 'en/' };

// Keys match the checkbox values in administraciones/strings.mjs.
export const INTERESTS = {
  accesibilidad: 'Accesibilidad web',
  actas: 'Actas de pleno con IA',
  asistente: 'Asistente o anonimización',
  taller: 'Taller de IA',
  datos: 'Hoja de protección de datos',
  otro: 'Otra cosa',
};

const LIMITS = { nombre: 200, organismo: 200, cargo: 200, email: 200, telefono: 40, mensaje: 5000 };
const REQUIRED = ['nombre', 'organismo', 'email'];
const EMAIL_RE = /^[^\s@<>()[\]",;:\\]+@[^\s@<>()[\]",;:\\]+\.[^\s@<>()[\]",;:\\]+$/;

const field = (form, name) => String(form.get(name) ?? '').trim();
// One-line fields end up in headers or labels: no line breaks or control characters.
const oneLine = (s) => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s{2,}/g, ' ');
const multiLine = (s) => s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '');

export function langOf(form) {
  const lang = field(form, 'lang');
  return Object.hasOwn(LANG_DIRS, lang) ? lang : 'es';
}

// Returns { lang, spam } for a filled honeypot, { lang, ok: false, error }
// for a submission that fails a check, or { lang, ok: true, data }.
export function parseSubmission(form) {
  const lang = langOf(form);
  if (field(form, 'web')) return { lang, spam: true };

  const data = {};
  for (const name of Object.keys(LIMITS)) {
    const value = field(form, name);
    if (value.length > LIMITS[name]) return { lang, ok: false, error: `${name} is too long` };
    data[name] = name === 'mensaje' ? multiLine(value) : oneLine(value);
  }
  for (const name of REQUIRED) {
    if (!data[name]) return { lang, ok: false, error: `${name} is required` };
  }
  if (!EMAIL_RE.test(data.email)) return { lang, ok: false, error: 'email is not valid' };
  if (field(form, 'privacidad') !== 'si') return { lang, ok: false, error: 'privacy notice not accepted' };

  data.interes = [...new Set(form.getAll('interes').map(String))].filter((k) => Object.hasOwn(INTERESTS, k));
  return { lang, ok: true, data };
}

function base64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

// RFC 2047 encoded words for header text that isn't plain ASCII, split so
// no word runs past the 75-character limit.
export function encodeHeader(text) {
  if (/^[\x20-\x7e]*$/.test(text)) return text;
  const chars = [...text];
  const words = [];
  for (let i = 0; i < chars.length; i += 16) words.push(`=?UTF-8?B?${base64(chars.slice(i, i + 16).join(''))}?=`);
  return words.join('\r\n ');
}

const displayName = (name) => (/^[\x20-\x7e]*$/.test(name) ? `"${name.replace(/["\\]/g, '')}"` : encodeHeader(name));

export function buildEmail({ data, lang, from, to, now, id }) {
  const interests = data.interes.map((k) => INTERESTS[k]).join(', ');
  const body = [
    `Nueva solicitud desde victoresteban.com/administraciones (idioma: ${lang}).`,
    '',
    `Nombre: ${data.nombre}`,
    `Organismo: ${data.organismo}`,
    `Cargo: ${data.cargo || '—'}`,
    `Correo: ${data.email}`,
    `Teléfono: ${data.telefono || '—'}`,
    `Interés: ${interests || '—'}`,
    '',
    'Mensaje:',
    data.mensaje || '—',
    '',
    '--',
    'Ha aceptado la información de protección de datos del formulario.',
    'Responde a este correo para contestarle directamente.',
  ].join('\n');

  const headers = [
    `From: "Formulario web" <${from}>`,
    `To: <${to}>`,
    `Reply-To: ${displayName(data.nombre)} <${data.email}>`,
    `Subject: ${encodeHeader(`Solicitud web · ${data.organismo}`)}`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: <${id}@victoresteban.com>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
  ];
  const encoded = base64(body.replace(/\n/g, '\r\n')).replace(/.{1,76}/g, '$&\r\n');
  return `${headers.join('\r\n')}\r\n\r\n${encoded}`;
}

export const thanksUrl = (lang) => `${SITE}/administraciones/${LANG_DIRS[lang]}gracias/`;
export const pageUrl = (lang) => `${SITE}/administraciones/${LANG_DIRS[lang]}`;

export function thanks(lang) {
  return new Response(null, { status: 303, headers: { Location: thanksUrl(lang) } });
}

const ERRORS = {
  es: { title: 'No se ha podido enviar', text: 'Algo ha fallado al enviar el formulario. Escríbeme directamente a', back: 'Volver al formulario' },
  va: { title: 'No s’ha pogut enviar', text: 'Alguna cosa ha fallat en enviar el formulari. Escriviu-me directament a', back: 'Tornar al formulari' },
  en: { title: 'The form could not be sent', text: 'Something went wrong sending the form. Please email me directly at', back: 'Back to the form' },
};

export function errorPage(lang, status) {
  const e = ERRORS[lang] ?? ERRORS.es;
  const html = `<!doctype html>
<html lang="${lang === 'va' ? 'ca-valencia' : lang}">
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${e.title}</title>
<body style="margin:0;background:#F7F5EF;color:#131A1C;font:16px/1.55 system-ui,sans-serif">
<main style="max-width:640px;margin:0 auto;padding:72px 20px">
<h1 style="font-weight:500;font-size:32px;line-height:1.15;margin:0 0 16px">${e.title}</h1>
<p>${e.text} <a style="color:#1E5B8C" href="mailto:hola@victoresteban.com">hola@victoresteban.com</a>.</p>
<p><a style="color:#1E5B8C" href="${pageUrl(lang)}#contacto">${e.back}</a></p>
</main>
</body>
</html>
`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
