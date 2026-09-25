import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const dataSource = readFileSync("portfolios/data.js", "utf8");
const siteSource = readFileSync("portfolios/cabanyal.jsx", "utf8");

function assertContains(source, expected, message) {
  assert.ok(source.includes(expected), message);
}

assert.ok(
  !dataSource.includes("example.com"),
  "window.VICTOR should not publish placeholder example.com contact data"
);

assert.ok(
  !dataSource.includes("emailHref") && !siteSource.includes("mailto:"),
  "Email contact should be omitted until a public contact strategy is decided"
);

assertContains(
  dataSource,
  'linkedinUrl: "https://www.linkedin.com/in/victorestebann"',
  "window.VICTOR should expose a full LinkedIn URL"
);

assertContains(
  dataSource,
  'githubUrl: "https://github.com/vicxs"',
  "window.VICTOR should expose the repository owner's full GitHub URL"
);

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dataSource, sandbox);
const { cvUrl } = sandbox.window.VICTOR;

for (const lang of ["en", "es"]) {
  const href = cvUrl?.[lang];
  assert.ok(href, `window.VICTOR should expose a ${lang} CV href`);
  assert.ok(
    !href.startsWith("http"),
    `${lang} CV href should point to the portfolio-hosted PDF asset`
  );
  assert.ok(
    href.endsWith(".pdf") && existsSync(path.join(".", href.replace(/^\/portfolio\//, ""))),
    `${lang} CV href should point to an existing local PDF asset`
  );
}
assert.notEqual(cvUrl.en, cvUrl.es, "Each language should download its own CV");

assertContains(
  siteSource,
  "cvUrl: tr(data.cvUrl, lang)",
  "The CV href should follow the selected language"
);

assertContains(
  siteSource,
  "href={v.linkedinUrl}",
  "Hero contact link should use the public LinkedIn URL while email is undecided"
);

assertContains(
  siteSource,
  "href={v.cvUrl}",
  "Hero and navigation CV links should render the CV href"
);

assertContains(
  siteSource,
  "{ k: 'LinkedIn', val: v.linkedin, href: v.linkedinUrl, external: true }",
  "Contact section LinkedIn label should come from shared contact data"
);

assertContains(
  siteSource,
  "{ k: 'GitHub', val: v.github, href: v.githubUrl, external: true }",
  "Contact section GitHub label should come from shared contact data"
);

assertContains(
  siteSource,
  'target="_blank"',
  "External links should open in a new tab"
);

assertContains(
  siteSource,
  'rel="noreferrer"',
  "External links should avoid passing referrer data"
);
