import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The portfolio exposes header, nav, main and footer landmarks, and a
// skip link as the first focusable element that jumps to <main>.
const site = readFileSync("portfolios/cabanyal.tsx", "utf8");
const css = readFileSync("portfolios/cabanyal.css", "utf8");

const skip = site.indexOf('<a className="skip" href="#main">{t.skipToContent}</a>');
assert.ok(skip > -1, "The portfolio should render a translated skip link to #main");
assert.ok(skip < site.indexOf('<header id="top"'), "The skip link should come before the header");
assert.match(site, /<header id="top" className="site-header/, "The site header should be a <header> landmark");
assert.match(site, /<nav className="nav" aria-label=/, "The section links should be a labelled <nav>");
assert.match(site, /<main id="main" tabIndex=\{-1\}>/, "<main> should be the skip link target");
assert.match(site, /<footer/, "The page should have a <footer>");

assert.match(css, /^\.skip \{[^}]*top: -48px/m, "The skip link should be off-screen until focused");
assert.match(css, /^\.skip:focus \{ top: 12px; \}/m, "The skip link should appear on focus");

console.log("landmarks and skip link are in place");
