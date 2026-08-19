import type { APIRoute } from 'astro'

/**
 * Собирается на каждую сборку, чтобы ссылка на карту сайта указывала на тот
 * адрес, под который собран сайт: корень гармаев.рф или подпапку на GitHub Pages.
 *
 * База берётся из переменной сборки, а не из import.meta.env.BASE_URL: внутри
 * маршрута-эндпоинта та подставляется как "/" даже при заданном base.
 */
export const GET: APIRoute = ({ site }) => {
  const base = (process.env.SITE_BASE || '/').replace(/\/*$/, '/')
  const sitemap = new URL('sitemap-index.xml', new URL(base, site)).href

  return new Response(
    ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
