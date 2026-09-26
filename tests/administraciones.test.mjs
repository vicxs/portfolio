import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { LANGS, STRINGS } from "../administraciones/strings.mjs";
import { PAGES, outputPath, renderPage } from "../administraciones/build.mjs";

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
  for (const [page, render] of PAGES) {
    const html = render(lang);
    const file = outputPath(lang, page);
    const name = path.relative(".", file);
    assert.ok(existsSync(file), `${name} should exist; run node administraciones/build.mjs`);
    assert.equal(readFileSync(file, "utf8"), html, `${name} is out of date; run node administraciones/build.mjs`);
    assert.ok(html.includes(`<html lang="${LANGS[lang].htmlLang}">`), `${name} should declare its language`);
    assert.ok(!/<script\b/.test(html), `${name} should work without scripts`);

    // Relative links resolve to files that exist (commented-out examples aside).
    const dir = path.dirname(file);
    for (const [, ref] of html.replace(/<!--[\s\S]*?-->/g, "").matchAll(/(?:src|href)="((?:\.\.\/)+[^"?#]*)/g)) {
      assert.ok(existsSync(path.join(dir, ref)), `${name} links to missing ${ref}`);
    }
  }

  const html = renderPage(lang);
  for (const other of langs) {
    assert.ok(html.includes(`hreflang="${LANGS[other].hreflang}" href="https://victoresteban.com/administraciones/${LANGS[other].dir}"`), `${lang} page should list the ${other} alternate`);
  }
  assert.ok(html.includes("mailto:hola@victoresteban.com"), `${lang} page should show the contact email`);
  assert.ok(html.includes(`assets/${LANGS[lang].cv}"`), `${lang} page should link the CV in its own language`);
  assert.ok(outputPath(lang, "gracias/") && readFileSync(outputPath(lang, "gracias/"), "utf8").includes('<meta name="robots" content="noindex" />'), `${lang} thank-you page should not be indexed`);
}

// The services page links to the portfolio, but not the other way round.
assert.ok(renderPage("es").includes('href="../?lang=es"'), "The Spanish page should link to the Spanish portfolio");
for (const file of ["index.html", "portfolios/main.tsx", "portfolios/cabanyal.tsx", "portfolios/i18n.ts", "portfolios/data.ts"]) {
  assert.ok(!readFileSync(file, "utf8").includes("administraciones"), `${file} should not link to the services page`);
}

console.log("services page is built and complete in es, va and en");
