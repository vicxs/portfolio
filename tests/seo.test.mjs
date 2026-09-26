import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { VICTOR } from "../portfolios/data.ts";

const SITE = "https://victoresteban.com/";
const html = readFileSync("index.html", "utf8");

// JSON-LD Person schema, kept in step with the content in data.ts.
const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
assert.equal(blocks.length, 1, "index.html should have exactly one JSON-LD block");
const person = JSON.parse(blocks[0][1]);
assert.equal(person["@context"], "https://schema.org");
assert.equal(person["@type"], "Person");
assert.equal(person.name, VICTOR.name, "JSON-LD name should match data.ts");
assert.equal(person.jobTitle, VICTOR.role, "JSON-LD jobTitle should match data.ts");
assert.equal(person.url, SITE);
assert.equal(person.email, VICTOR.emailUrl, "JSON-LD email should match data.ts");
assert.deepEqual(person.sameAs, [VICTOR.linkedinUrl, VICTOR.githubUrl], "JSON-LD sameAs should list LinkedIn and GitHub from data.ts");
assert.equal(person.alumniOf?.name, VICTOR.education.school, "JSON-LD alumniOf should match data.ts");
assert.ok(Array.isArray(person.knowsAbout) && person.knowsAbout.length > 0, "JSON-LD should list knowsAbout");

// Locales and language alternates.
assert.match(html, /<meta property="og:locale" content="en_US" \/>/, "index.html should declare og:locale en_US");
assert.match(html, /<meta property="og:locale:alternate" content="es_ES" \/>/, "index.html should declare the es_ES alternate locale");
for (const [lang, href] of [["en", SITE], ["es", `${SITE}?lang=es`], ["x-default", SITE]]) {
  assert.ok(html.includes(`<link rel="alternate" hreflang="${lang}" href="${href}" />`), `index.html should link the ${lang} alternate`);
}

// robots.txt allows everything and points to the sitemap.
const robots = readFileSync("robots.txt", "utf8");
assert.match(robots, /^User-agent: \*$/m);
assert.match(robots, /^Allow: \/$/m);
assert.ok(!/^Disallow:\s*\S/m.test(robots), "robots.txt should not disallow anything");
assert.match(robots, new RegExp(`^Sitemap: ${SITE}sitemap\\.xml$`, "m"));

// The sitemap lists every indexable page, and each one exists in the repo.
const sitemap = readFileSync("sitemap.xml", "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
assert.deepEqual(locs, [
  SITE,
  `${SITE}administraciones/`,
  `${SITE}administraciones/va/`,
  `${SITE}administraciones/en/`,
], "sitemap.xml should list the portfolio and the three services pages");
const hrefs = [...sitemap.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
for (const url of [...locs, ...hrefs]) {
  assert.ok(url.startsWith(SITE), `${url} should be on ${SITE}`);
  const file = path.join(new URL(url).pathname.slice(1), "index.html");
  assert.ok(existsSync(file), `${url} should map to ${file}`);
  const page = readFileSync(file, "utf8");
  assert.ok(!page.includes('name="robots" content="noindex"'), `${url} should be indexable`);
}
assert.ok(!sitemap.includes("gracias"), "sitemap.xml should leave out the thank-you pages");

console.log("SEO metadata, robots.txt and sitemap.xml are configured");
