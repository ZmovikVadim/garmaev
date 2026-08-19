import type { APIRoute } from 'astro'

/**
 * Собирается на каждую сборку, чтобы ссылка на карту сайта указывала на тот
 * адрес, под который собран сайт: гармаев.рф или превью на GitHub Pages.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href

  return new Response(
    ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
