import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Validate the actual production output, including links produced from shared data.
const routes = ['/', '/products', '/about', '/contact', '/delivery', '/property-guide'];
const pages = new Map(await Promise.all(routes.map(async route => [route,
  await readFile(`.next/server/app/${route === '/' ? 'index' : route.slice(1)}.html`, 'utf8')
])));
const forbidden = /07XXXXXXXXX|hello@cocolocal\.co\.uk|VIDEO PLACEHOLDER|PRODUCT IMAGE|href="#"|30–45 minutes/;
let checkedLinks = 0;
for (const [route, html] of pages) {
  assert(!forbidden.test(html), `${route}: obsolete placeholder content`);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${route}: exactly one page heading`);
  if (route !== '/property-guide') {
    assert(html.includes('tel:+447483423869'), `${route}: working phone link`);
    assert(html.includes('mailto:210cocolocal@gmail.com'), `${route}: working email link`);
    assert(!html.includes('href="/property-guide"'), `${route}: private guide exposed in navigation`);
    assert(html.includes(`rel="canonical" href="https://cocolocal.co.uk${route === '/' ? '' : route}"`) ||
      (route === '/' && html.includes('rel="canonical" href="https://cocolocal.co.uk/"')),
      `${route}: correct canonical URL`);
  }
  for (const [, encoded] of html.matchAll(/<a\b[^>]*href="([^\"]+)"/g)) {
    const href = encoded.replaceAll('&amp;', '&');
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    const target = new URL(href, `https://cocolocal.co.uk${route}`);
    assert(pages.has(target.pathname), `${route}: missing route ${href}`);
    if (target.hash) {
      assert(pages.get(target.pathname).includes(`id="${decodeURIComponent(target.hash.slice(1))}"`),
        `${route}: missing anchor ${href}`);
    }
    checkedLinks++;
  }
  for (const [, raw] of html.matchAll(/<img\b[^>]*src="([^\"]+)"/g)) {
    const src = new URL(raw.replaceAll('&amp;', '&'), 'https://cocolocal.co.uk');
    const localPath = src.pathname === '/_next/image' ? src.searchParams.get('url') : src.pathname;
    if (localPath?.startsWith('/images/')) await access(`public${localPath}`);
  }
}
const guide = pages.get('/property-guide');
assert(guide.includes('noindex') && guide.includes('guide-password'), 'Guide must remain private and password gated');
assert(!guide.includes('srcdoc='), 'Guide must not ship decrypted in server-rendered output');
const sitemap = await readFile('.next/server/app/sitemap.xml.body', 'utf8');
assert(!sitemap.includes('property-guide'), 'Private guide must not be in sitemap');
console.log(`Site checks passed: ${pages.size} routes, ${checkedLinks} internal links, image files, canonical URLs and private-guide safeguards.`);
