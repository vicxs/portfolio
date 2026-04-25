import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const indexPath = path.join(repoRoot, 'index.html');
const html = await readFile(indexPath, 'utf8');

const expectedSiteUrl = 'https://vicxs.github.io/portfolio/';
const expectedTitle = 'Victor Esteban — Software Engineer';
const expectedDescription =
  'Victor Esteban — Software Engineer. Backend, system integration, production support.';
const expectedThemeColor = '#0E0F11';

function findMetaValue(attribute, key) {
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\b${attribute}=["']${escapeRegExp(key)}["'])(?=[^>]*\\bcontent=["']([^"']+)["'])[^>]*>`,
    'i',
  );
  return html.match(pattern)?.[1];
}

function findLinkHref(rel) {
  const pattern = new RegExp(
    `<link\\b(?=[^>]*\\brel=["']${escapeRegExp(rel)}["'])(?=[^>]*\\bhref=["']([^"']+)["'])[^>]*>`,
    'i',
  );
  return html.match(pattern)?.[1];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localAssetFromLiveUrl(url) {
  assert.ok(
    url.startsWith(expectedSiteUrl),
    `${url} should use the live site URL prefix ${expectedSiteUrl}`,
  );

  return url.slice(expectedSiteUrl.length);
}

async function assertLocalAssetExists(assetPath) {
  assert.ok(assetPath.length > 0, 'asset path should not be empty');
  assert.equal(
    path.normalize(assetPath),
    assetPath,
    `${assetPath} should be a normalized relative asset path`,
  );
  assert.ok(
    !assetPath.startsWith('..') && !path.isAbsolute(assetPath),
    `${assetPath} should stay inside the repository`,
  );

  await access(path.join(repoRoot, assetPath));
}

assert.equal(findMetaValue('property', 'og:title'), expectedTitle);
assert.equal(findMetaValue('property', 'og:description'), expectedDescription);
assert.equal(findMetaValue('property', 'og:url'), expectedSiteUrl);
assert.equal(findMetaValue('property', 'og:type'), 'website');

assert.equal(findMetaValue('name', 'twitter:card'), 'summary');
assert.equal(findMetaValue('name', 'twitter:title'), expectedTitle);
assert.equal(findMetaValue('name', 'twitter:description'), expectedDescription);

assert.equal(findMetaValue('name', 'theme-color'), expectedThemeColor);
assert.equal(findLinkHref('canonical'), expectedSiteUrl);

const faviconPath = findLinkHref('icon');
const appleTouchIconPath = findLinkHref('apple-touch-icon');
const ogImageUrl = findMetaValue('property', 'og:image');
const twitterImageUrl = findMetaValue('name', 'twitter:image');

assert.equal(faviconPath, 'assets/favicon.ico');
assert.equal(appleTouchIconPath, 'assets/apple-touch-icon.png');
assert.equal(ogImageUrl, twitterImageUrl);

await assertLocalAssetExists(faviconPath);
await assertLocalAssetExists(appleTouchIconPath);
await assertLocalAssetExists(localAssetFromLiveUrl(ogImageUrl));

console.log('social preview metadata and assets are configured');
