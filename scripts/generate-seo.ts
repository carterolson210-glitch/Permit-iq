// Generates public/sitemap.xml and public/robots.txt at build time, from
// the same town data the app itself renders — no separate list to drift
// out of sync. Runs via tsx (see package.json's "build" script).
//
// Only hand-verified town pages are listed in the sitemap. Unverified town
// pages are deliberately noindex'd (TownPermitPage.tsx) since 300+
// near-identical AI-only pages would read as thin/doorway content to
// search engines — listing them in the sitemap would contradict that
// signal, so they're left out on purpose, not by oversight.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { TOWN_PROFILES } from '../src/data/townPermits'

const SITE_URL = (process.env.SITE_URL ?? 'https://permit-iq-rho.vercel.app').replace(/\/$/, '')

type Route = { path: string; priority: number; changefreq: string; lastmod?: string }

const STATIC_ROUTES: Route[] = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/analyze', priority: 0.9, changefreq: 'monthly' },
  { path: '/pricing', priority: 0.8, changefreq: 'weekly' },
  { path: '/coverage', priority: 0.6, changefreq: 'weekly' },
  { path: '/how-we-verify', priority: 0.5, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.1, changefreq: 'yearly' },
  { path: '/terms', priority: 0.1, changefreq: 'yearly' },
]

const townRoutes: Route[] = TOWN_PROFILES.map((t) => ({
  path: `/permits/${t.slug}`,
  priority: 0.7,
  changefreq: 'monthly',
  lastmod: t.facts[0]?.verifiedAt,
}))

const allRoutes = [...STATIC_ROUTES, ...townRoutes]

const urls = allRoutes
  .map((r) => {
    const lastmodTag = r.lastmod ? `\n    <lastmod>${r.lastmod}</lastmod>` : ''
    return `  <url>
    <loc>${SITE_URL}${r.path}</loc>${lastmodTag}
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  })
  .join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`

const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
writeFileSync(`${publicDir}sitemap.xml`, sitemap)
writeFileSync(`${publicDir}robots.txt`, robots)

console.log(
  `[generate-seo] wrote sitemap.xml (${allRoutes.length} urls, ${townRoutes.length} verified towns) and robots.txt for ${SITE_URL}`
)
