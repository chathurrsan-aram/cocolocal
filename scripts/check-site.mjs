import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Validate the actual production output, including links produced from shared data.
const routes = ['/', '/products', '/about', '/contact', '/delivery', '/property-guide', '/wheel', '/wheel/terms', '/wheel/privacy'];
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
    if (target.pathname.startsWith('/video/')) { await access(`public${target.pathname}`); checkedLinks++; continue; }
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
// Check media sources/posters as well as linked pages.
for (const html of pages.values()) {
  for (const [, asset] of html.matchAll(/(?:src|poster)="(\/video\/[^"]+)"/g)) await access(`public${asset}`);
}
const guide = pages.get('/property-guide');
assert(guide.includes('noindex') && guide.includes('guide-password'), 'Guide must remain private and password gated');
assert(!guide.includes('srcdoc='), 'Guide must not ship decrypted in server-rendered output');
const sitemap = await readFile('.next/server/app/sitemap.xml.body', 'utf8');
const wheel = pages.get('/wheel');
// While /wheel is password-protected it stays out of the sitemap, and the gate must exist.
assert(!sitemap.includes('/wheel<'), 'Password-protected wheel must not be in sitemap');
const { readFile: rf } = await import('node:fs/promises');
const middleware = await rf('src/middleware.ts', 'utf8');
assert(middleware.includes("'/wheel'") && middleware.includes("'/api/wheel/spin'"), 'Wheel page and spin API must be behind the password gate');
const unlock = await rf('src/app/wheel/unlock/page.tsx', 'utf8');
assert(unlock.includes('index: false') && unlock.includes('action="/api/wheel/unlock"'), 'Unlock page must be noindex and post to the unlock API');
assert(wheel.includes('/wheel/og.jpg') && wheel.includes('href="/wheel/terms"') && wheel.includes('href="/wheel/privacy"'), 'Wheel needs OG image and terms/privacy links');
// While the wheel is coming soon (wheelConfig.comingSoon) nothing public links to it.
const wheelData = await rf('src/data/wheel.ts', 'utf8');
const comingSoon = /comingSoon:\s*true/.test(wheelData);
assert(!pages.get('/').includes('href="/spin"'), 'Homepage must not link to the old /spin address');
assert(comingSoon ? !pages.get('/').includes('href="/wheel"') : pages.get('/').includes('href="/wheel"'),
  comingSoon ? 'Homepage must not link to the wheel while it is coming soon' : 'Homepage links to the live wheel');
for (const route of ['/wheel/terms', '/wheel/privacy']) {
  assert(pages.get(route).includes('noindex') && pages.get(route).includes('DRAFT'), `${route}: must be marked DRAFT and noindex until approved`);
}
assert(!sitemap.includes('property-guide'), 'Private guide must not be in sitemap');
console.log(`Site checks passed: ${pages.size} routes, ${checkedLinks} internal links, image files, canonical URLs and private-guide safeguards.`);
