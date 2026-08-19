import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

/**
 * На Timeweb сайт живёт в корне домена, на GitHub Pages — в подпапке /garmaev.
 * Оба адреса задаются переменными окружения при сборке, по умолчанию — корень:
 *
 *   npm run build                                   → для Timeweb
 *   SITE_BASE=/garmaev SITE_URL=... npm run build    → для GitHub Pages
 *
 * Внутренние ссылки строятся через withBase() из src/lib/url.ts — иначе в
 * подпапке они уедут в корень домена.
 */
const base = process.env.SITE_BASE || '/'
const site = process.env.SITE_URL || 'https://xn--80aagbm4b1a.xn--p1ai'

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    // /biography/index.html — работает на любом Apache/nginx без правил rewrite.
    format: 'directory',
  },
})
