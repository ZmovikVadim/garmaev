/**
 * Готовит галерею из ../Photos для сайта.
 *
 * Исходники не трогаются. На выходе:
 *   public/gallery/<album>/<n>.jpg       — большая версия, до 1800px
 *   public/gallery/<album>/<n>-thumb.jpg — превью для ленты, до 700px
 *   public/gallery/<album>/<n>-icon.jpg  — пиктограмма для выбора, до 200px
 *   src/data/gallery.json                — манифест: альбомы, порядок, размеры
 *
 * Порядок альбомов и периоды заданы вручную в ALBUMS: метаданные снимков
 * содержат даты сканирования (2008, 2018), а не даты съёмки, так что
 * хронологию по ним восстановить нельзя.
 */
import { readdir, mkdir, writeFile, rm } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import sharp from 'sharp'

const SRC = new URL('../../Photos/', import.meta.url).pathname
const OUT = new URL('../public/gallery/', import.meta.url).pathname
const MANIFEST = new URL('../src/data/gallery.json', import.meta.url).pathname

// Порядок = линия жизни. Периоды приблизительные, уточняются.
const ALBUMS = [
  { dir: 'Комсомол', slug: 'komsomol', title: 'Комсомол', period: '1962–1970' },
  { dir: 'Работа', slug: 'rabota', title: 'Работа', period: '1970-е — 1990-е' },
  { dir: 'Работа 2', slug: 'rabota-2', title: 'Работа. Продолжение', period: '1990-е — 2000-е' },
  { dir: 'Япония', slug: 'yaponiya', title: 'Япония', period: 'год уточняется' },
  { dir: 'Далай лама', slug: 'dalai-lama', title: 'Далай-лама', period: 'год уточняется' },
  { dir: 'Дом ветеранов', slug: 'dom-veteranov', title: 'Дом ветеранов', period: '2005–2019' },
  { dir: 'Семья', slug: 'semya', title: 'Семья', period: 'разные годы' },
  { dir: 'Последнее фото', slug: 'poslednee-foto', title: 'Последние снимки', period: '2010-е' },
]

const FULL = 1800
const THUMB = 700
const ICON = 200

/** Имя файла потеряло кодировку: 11 символов U+FFFD + " 700" = «Изображение 700». */
const fixName = (name) => name.replace(/�+/g, 'Изображение')

/** Подпись из имени файла, если оно осмысленное; иначе null. */
function captionFrom(name) {
  const stem = fixName(basename(name, extname(name)))
  // Служебные имена камеры и сканера подписью не считаем.
  if (/^(DSCN|IMG|DSC|P)[\s_]?\d+$/i.test(stem)) return null
  if (/^(Копия\s+)?Изображение\s+\d+$/i.test(stem)) return null
  if (/^0{4,}\d+$/.test(stem)) return null
  if (/^[A-Za-z0-9_-]{8,}$/.test(stem)) return null // выгрузки из соцсетей
  if (/^Ревомир Баярович(\s*\(\d+\))?$/i.test(stem)) return null
  return stem
    .replace(/\)+\s*$/, '')
    .replace(/\s*\)+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp', '.avif'])

/**
 * Снимки, которые не публикуются. Оригиналы остаются в Photos/ — здесь только
 * исключение из сборки, чтобы решение можно было отменить.
 * Ключ — «папка/имя файла».
 */
const EXCLUDE = new Set(['Работа/Изображение 006.jpg'])

async function processAlbum(album) {
  const srcDir = join(SRC, album.dir)
  const outDir = join(OUT, album.slug)
  await mkdir(outDir, { recursive: true })

  const names = (await readdir(srcDir))
    .filter((n) => IMAGE_EXT.has(extname(n).toLowerCase()))
    .filter((n) => !EXCLUDE.has(`${album.dir}/${n}`))
    .sort((a, b) => fixName(a).localeCompare(fixName(b), 'ru', { numeric: true }))

  const photos = []
  let i = 0
  for (const name of names) {
    i += 1
    const id = String(i).padStart(2, '0')
    const input = sharp(join(srcDir, name), { failOn: 'none' }).rotate()
    const { width, height } = await input.metadata()

    const full = `${id}.jpg`
    const thumb = `${id}-thumb.jpg`
    const icon = `${id}-icon.jpg`

    const meta = await input
      .clone()
      .resize({ width: FULL, height: FULL, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(join(outDir, full))

    await input
      .clone()
      .resize({ width: THUMB, height: THUMB, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(join(outDir, thumb))

    // Пиктограмма кадрируется в квадрат: ряд выбора должен быть ровным.
    await input
      .clone()
      .resize({ width: ICON, height: ICON, fit: 'cover', position: 'centre' })
      .jpeg({ quality: 72, mozjpeg: true })
      .toFile(join(outDir, icon))

    photos.push({
      src: `/gallery/${album.slug}/${full}`,
      thumb: `/gallery/${album.slug}/${thumb}`,
      icon: `/gallery/${album.slug}/${icon}`,
      width: meta.width,
      height: meta.height,
      caption: captionFrom(name),
      source: name, // чтобы было понятно, какой файл править
    })
    process.stdout.write(`  ${album.slug}/${full}  ${meta.width}×${meta.height}  ${width}×${height} исходник\n`)
  }

  return { ...album, photos }
}

await rm(OUT, { recursive: true, force: true })
const albums = []
for (const album of ALBUMS) {
  console.log(`\n${album.title} (${album.dir})`)
  albums.push(await processAlbum(album))
}

await mkdir(new URL('../src/data/', import.meta.url).pathname, { recursive: true })
await writeFile(MANIFEST, JSON.stringify({ albums }, null, 2) + '\n', 'utf8')

const total = albums.reduce((n, a) => n + a.photos.length, 0)
console.log(`\nГотово: ${total} снимков в ${albums.length} альбомах.`)
