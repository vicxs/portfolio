import assert from "node:assert/strict";
import { VICTOR } from "../portfolios/data.ts";
import { STRINGS } from "../portfolios/i18n.ts";

const LANGS = ["en", "es", "va"];

assert.deepEqual(Object.keys(STRINGS).sort(), [...LANGS].sort(), "STRINGS should define exactly en, es and va");

const enKeys = Object.keys(STRINGS.en).sort();
for (const lang of LANGS) {
  assert.deepEqual(Object.keys(STRINGS[lang]).sort(), enKeys, `STRINGS.${lang} should define the same keys as STRINGS.en`);
  for (const [key, value] of Object.entries(STRINGS[lang])) {
    const values = Array.isArray(value) ? value : [value];
    assert.ok(values.length > 0 && values.every((s) => typeof s === "string" && s.trim()), `STRINGS.${lang}.${key} should be non-empty text`);
  }
}
for (const lang of LANGS) {
  assert.equal(STRINGS[lang].hero.length, STRINGS.en.hero.length, `Hero headline (${lang}) should have as many lines as in English`);
}

// Every { en, es, va } triple in the content must be complete and of matching shape.
function walk(value, where) {
  if (Array.isArray(value)) return value.forEach((item, i) => walk(item, `${where}[${i}]`));
  if (!value || typeof value !== "object") return;
  if (LANGS.some((lang) => lang in value)) {
    assert.deepEqual(Object.keys(value).sort(), [...LANGS].sort(), `${where} should have en, es and va`);
    const { en } = value;
    for (const lang of LANGS) {
      const text = value[lang];
      if (Array.isArray(en)) {
        assert.ok(Array.isArray(text) && text.length === en.length, `${where}.${lang} should list as many items as ${where}.en`);
        text.forEach((s, i) => assert.ok(typeof s === "string" && s.trim(), `${where}.${lang} item ${i} should be non-empty text`));
      } else {
        assert.ok(typeof text === "string" && text.trim(), `${where}.${lang} should be non-empty text`);
      }
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
  va: "Gen|Feb|Mar|Abr|Mai|Jun|Jul|Ago|Set|Oct|Nov|Des",
};
const PRESENT = { en: "Present", es: "Actualidad", va: "Actualitat" };
for (const lang of LANGS) {
  const date = `(?:${MONTHS[lang]}) \\d{4}`;
  const period = new RegExp(`^${date} — (?:${date}|${PRESENT[lang]})$`);
  VICTOR.experiences.forEach((e) => {
    assert.match(e.period[lang], period, `${e.company} period (${lang}) should use three-letter months`);
  });
}

console.log("translations are complete for en, es and va");
