import assert from "node:assert/strict";
import { VICTOR } from "../portfolios/data.ts";
import { STRINGS } from "../portfolios/i18n.ts";

const LANGS = ["en", "es"];

assert.deepEqual(Object.keys(STRINGS).sort(), [...LANGS].sort(), "STRINGS should define exactly en and es");

const enKeys = Object.keys(STRINGS.en).sort();
for (const lang of LANGS) {
  assert.deepEqual(Object.keys(STRINGS[lang]).sort(), enKeys, `STRINGS.${lang} should define the same keys as STRINGS.en`);
  for (const [key, value] of Object.entries(STRINGS[lang])) {
    const values = Array.isArray(value) ? value : [value];
    assert.ok(values.length > 0 && values.every((s) => typeof s === "string" && s.trim()), `STRINGS.${lang}.${key} should be non-empty text`);
  }
}
assert.equal(STRINGS.en.hero.length, STRINGS.es.hero.length, "Hero headline should have the same number of lines in each language");

// Every { en, es } pair in the content must be complete and of matching shape.
function walk(value, where) {
  if (Array.isArray(value)) return value.forEach((item, i) => walk(item, `${where}[${i}]`));
  if (!value || typeof value !== "object") return;
  if ("en" in value || "es" in value) {
    assert.deepEqual(Object.keys(value).sort(), [...LANGS].sort(), `${where} should have both en and es`);
    const [en, es] = [value.en, value.es];
    if (Array.isArray(en)) {
      assert.ok(Array.isArray(es) && es.length === en.length, `${where}.es should list as many items as ${where}.en`);
      [...en, ...es].forEach((s, i) => assert.ok(typeof s === "string" && s.trim(), `${where} item ${i} should be non-empty text`));
    } else {
      assert.ok(typeof en === "string" && en.trim() && typeof es === "string" && es.trim(), `${where} should be non-empty text in both languages`);
    }
    return;
  }
  for (const [key, child] of Object.entries(value)) walk(child, `${where}.${key}`);
}
walk(VICTOR, "VICTOR");

// Periods read "Mmm YYYY — Mmm YYYY", with three-letter months, or end in the present.
const MONTHS = {
  en: "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec",
  es: "Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic",
};
const PRESENT = { en: "Present", es: "Actualidad" };
for (const lang of LANGS) {
  const date = `(?:${MONTHS[lang]}) \\d{4}`;
  const period = new RegExp(`^${date} — (?:${date}|${PRESENT[lang]})$`);
  VICTOR.experiences.forEach((e) => {
    assert.match(e.period[lang], period, `${e.company} period (${lang}) should use three-letter months`);
  });
}

console.log("translations are complete for en and es");
