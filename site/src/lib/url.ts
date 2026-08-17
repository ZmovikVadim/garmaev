/**
 * Приклеивает базовый путь сборки к внутренней ссылке.
 *
 * В корне домена (Timeweb) BASE_URL = "/" и ссылка не меняется.
 * На GitHub Pages BASE_URL = "/garmaev/" и "/gallery" превращается
 * в "/garmaev/gallery".
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '')

export function withBase(path: string): string {
  if (!path.startsWith('/')) return path
  return `${BASE}${path}` || '/'
}

/** Сравнивает текущий адрес страницы с внутренней ссылкой меню. */
export function isCurrent(pathname: string, href: string): boolean {
  const strip = (value: string) => value.replace(/\/+$/, '') || '/'
  return strip(pathname) === strip(withBase(href))
}
