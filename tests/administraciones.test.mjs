import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { LANGS, STRINGS } from "../administraciones/strings.mjs";
import { outputPath, renderPage } from "../administraciones/build.mjs";

const langs = Object.keys(LANGS);
assert.deepEqual(langs, ["es", "va", "en"], "The services page should be in Spanish, Valencian and English");

// Every language has the same copy, list for list.
function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  assert.ok(typeof value === "string" && value.trim(), "copy should be non-empty text");
  return "text";
}
for (const lang of langs) {
  assert.deepEqual(shape(STRINGS[lang]), shape(STRINGS.es), `STRINGS.${lang} should match the shape of STRINGS.es`);
}
for (const lang of langs) {
  assert.deepEqual(STRINGS[lang].services.map((s) => s.tile), STRINGS.es.services.map((s) => s.tile), `${lang} services should use the same tiles`);
}

for (const lang of langs) {
  const html = renderPage(lang);
  const file = outputPath(lang);
  assert.ok(existsSync(file), `${path.relative(".", file)} should exist; run node administraciones/build.mjs`);
  assert.equal(readFileSync(file, "utf8"), html, `${path.relative(".", file)} is out of date; run node administraciones/build.mjs`);

  assert.ok(html.includes(`<html lang="${LANGS[lang].htmlLang}">`), `${lang} page should declare its language`);
  for (const other of langs) {
    assert.ok(html.includes(`hreflang="${LANGS[other].hreflang}" href="https://victoresteban.com/administraciones/${LANGS[other].dir}"`), `${lang} page should list the ${other} alternate`);
  }
  assert.ok(!/<script\b/.test(html), `${lang} page should work without scripts`);
  assert.ok(html.includes("mailto:hola@victoresteban.com?subject="), `${lang} page should offer the contact email`);

  // Relative links resolve to files that exist (commented-out examples aside).
  const dir = path.dirname(file);
  for (const [, ref] of html.replace(/<!--[\s\S]*?-->/g, "").matchAll(/(?:src|href)="((?:\.\.\/)+[^"?#]*)/g)) {
    const target = path.join(dir, ref);
    assert.ok(existsSync(target), `${lang} page links to missing ${ref}`);
  }
}

// The services page links to the portfolio, but not the other way round.
assert.ok(renderPage("es").includes('href="../?lang=es"'), "The Spanish page should link to the Spanish portfolio");
for (const file of ["index.html", "portfolios/cabanyal.jsx", "portfolios/i18n.js", "portfolios/data.js"]) {
  assert.ok(!readFileSync(file, "utf8").includes("administraciones"), `${file} should not link to the services page`);
}

console.log("services page is built and complete in es, va and en");
