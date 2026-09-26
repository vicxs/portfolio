import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STRINGS } from "../administraciones/strings.mjs";
import { FORM_ACTION, renderPage } from "../administraciones/build.mjs";
import { INTERESTS, buildEmail, encodeHeader, parseSubmission, thanks, thanksUrl } from "../workers/contacto/src/message.js";

const form = (fields) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) (Array.isArray(v) ? v : [v]).forEach((x) => f.append(k, x));
  return f;
};
const valid = {
  lang: "va",
  nombre: "Maria Garcia Peña",
  organismo: "Ajuntament de Mislata",
  cargo: "Secretària",
  email: "maria@mislata.es",
  telefono: "",
  interes: ["actas", "taller", "unknown"],
  mensaje: "Hola,\r\nvolem veure la demo.",
  privacidad: "si",
  web: "",
};

// Accepts a complete submission and keeps only known interests.
const ok = parseSubmission(form(valid));
assert.equal(ok.ok, true);
assert.equal(ok.lang, "va");
assert.deepEqual(ok.data.interes, ["actas", "taller"]);
assert.equal(ok.data.mensaje, "Hola,\nvolem veure la demo.");

// Rejects missing or malformed required fields and a missing consent.
for (const [change, why] of [
  [{ nombre: "" }, "name is required"],
  [{ organismo: " " }, "organisation is required"],
  [{ email: "not-an-email" }, "email must be valid"],
  [{ email: "a@b.es\r\nBcc: x@y.z" }, "email must not smuggle headers"],
  [{ privacidad: "" }, "consent is required"],
  [{ mensaje: "x".repeat(5001) }, "message has a limit"],
]) {
  assert.equal(parseSubmission(form({ ...valid, ...change })).ok, false, why);
}

// A filled honeypot is spam; an unknown language falls back to Spanish.
assert.equal(parseSubmission(form({ ...valid, web: "http://spam" })).spam, true);
assert.equal(parseSubmission(form({ ...valid, lang: "fr" })).lang, "es");

// One-line fields cannot break out of the email headers.
const sneaky = parseSubmission(form({ ...valid, organismo: "Ajuntament\r\nBcc: x@y.z" }));
assert.ok(!/[\r\n]/.test(sneaky.data.organismo));

// The email: Reply-To the sender, encoded subject, base64 UTF-8 body.
const raw = buildEmail({ data: ok.data, lang: "va", from: "formulario@victoresteban.com", to: "me@example.org", now: new Date("2026-09-26T10:00:00Z"), id: "abc" });
const [head, body] = raw.split("\r\n\r\n");
assert.match(head, /^From: "Formulario web" <formulario@victoresteban\.com>\r\n/);
assert.match(head, /\r\nTo: <me@example\.org>\r\n/);
assert.match(head, /\r\nReply-To: =\?UTF-8\?B\?[^\r\n]+\?=\r\n? ?.*<maria@mislata\.es>/s);
assert.match(head, /\r\nMessage-ID: <abc@victoresteban\.com>\r\n/);
assert.ok(head.split("\r\n").every((line) => line.length <= 998), "header lines stay within the RFC limit");
const text = Buffer.from(body.replace(/\r\n/g, ""), "base64").toString("utf8");
assert.ok(text.includes("Organismo: Ajuntament de Mislata"));
assert.ok(text.includes("Interés: Actas de pleno con IA, Taller de IA"));
assert.ok(text.includes("volem veure la demo."));
const words = encodeHeader("Solicitud web · Ajuntament de València").split("\r\n ");
assert.ok(words.every((w) => w.length <= 75), "encoded words stay within 75 characters");
assert.equal(words.map((w) => Buffer.from(w.slice(10, -2), "base64").toString("utf8")).join(""), "Solicitud web · Ajuntament de València");

// Redirects to the thank-you page in the sender's language.
assert.equal(thanks("en").headers.get("Location"), "https://victoresteban.com/administraciones/en/gracias/");
assert.equal(thanksUrl("es"), "https://victoresteban.com/administraciones/gracias/");

// The page's checkboxes and the Worker agree on the interests.
for (const lang of Object.keys(STRINGS)) {
  assert.deepEqual(STRINGS[lang].form.interests.map(([k]) => k), Object.keys(INTERESTS), `${lang} interests should match the Worker`);
}

// The form posts to the Worker's route, with the fields the Worker reads.
const wrangler = readFileSync("workers/contacto/wrangler.toml", "utf8");
const host = wrangler.match(/pattern = "([^"]+)"/)[1];
assert.equal(FORM_ACTION, `https://${host}/contacto`);
const page = renderPage("es");
assert.ok(page.includes(`<form class="form" action="${FORM_ACTION}" method="post"`));
for (const name of ["lang", "nombre", "organismo", "cargo", "email", "telefono", "interes", "mensaje", "web", "privacidad"]) {
  assert.ok(page.includes(`name="${name}"`), `form should send ${name}`);
}
assert.ok(!/TO\s*=/.test(wrangler), "the destination address stays out of the repository");

console.log("contact form and Worker agree");
