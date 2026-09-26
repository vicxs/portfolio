import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

// GitHub Pages serves 404.html at any missing path, so it must not rely
// on relative URLs and must stay out of search results.
const html = readFileSync("404.html", "utf8");

assert.match(html, /<meta name="robots" content="noindex" \/>/, "404.html should be noindex");
assert.ok(html.includes('href="/"'), "404.html should link back to the home page");
assert.ok(html.includes('href="/?lang=es"'), "404.html should link to the Spanish home page");
assert.match(html, /<a class="skip" href="#main">/, "404.html should have a skip link");
assert.match(html, /<main id="main"/, "404.html skip link should target <main>");

const urls = [...html.matchAll(/(?:href|src)="([^"#]+)"|url\(([^)]+)\)/g)].map((m) => m[1] ?? m[2]);
for (const url of urls) {
  if (/^https:\/\//.test(url)) continue;
  assert.ok(url.startsWith("/"), `404.html should use absolute paths, found ${url}`);
  const file = url.split("?")[0].slice(1) || "index.html";
  assert.ok(existsSync(file), `${url} should point to an existing file`);
}

console.log("404 page is configured");
