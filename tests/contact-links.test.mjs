import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const dataSource = readFileSync("portfolios/data.js", "utf8");
const systemsSource = readFileSync("portfolios/systems.jsx", "utf8");

function assertContains(source, expected, message) {
  assert.ok(source.includes(expected), message);
}

assert.ok(
  !dataSource.includes("example.com"),
  "window.VICTOR should not publish placeholder example.com contact data"
);

assert.ok(
  !dataSource.includes("emailHref") && !systemsSource.includes("mailto:"),
  "Email contact should be omitted until a public contact strategy is decided"
);

assertContains(
  dataSource,
  'linkedinUrl: "https://www.linkedin.com/in/victoresteban"',
  "window.VICTOR should expose a full LinkedIn URL"
);

assertContains(
  dataSource,
  'githubUrl: "https://github.com/vicxs"',
  "window.VICTOR should expose the repository owner's full GitHub URL"
);

const cvUrl = dataSource.match(/cvUrl:\s*"([^"]+)"/)?.[1];
assert.ok(cvUrl, "window.VICTOR should expose a CV href");
assert.ok(
  !cvUrl.startsWith("http"),
  "CV href should point to the portfolio-hosted PDF asset"
);
assert.ok(
  existsSync(path.join(".", cvUrl.replace(/^\/portfolio\//, ""))),
  "CV href should point to an existing local PDF asset"
);

assertContains(
  systemsSource,
  "href={v.linkedinUrl}",
  "CONTACT hero button should use the public LinkedIn URL while email is undecided"
);

assertContains(
  systemsSource,
  "href={v.cvUrl}",
  "CV.PDF hero button should render the CV href"
);

assertContains(
  systemsSource,
  "{ k: 'LINKEDIN', val: v.linkedin, href: v.linkedinUrl, external: true }",
  "Contact section LinkedIn label should come from shared contact data"
);

assertContains(
  systemsSource,
  "{ k: 'GITHUB', val: v.github, href: v.githubUrl, external: true }",
  "Contact section GitHub label should come from shared contact data"
);

assertContains(
  systemsSource,
  'target="_blank"',
  "External links should open in a new tab"
);

assertContains(
  systemsSource,
  'rel="noreferrer"',
  "External links should avoid passing referrer data"
);
