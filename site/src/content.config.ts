import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    author: z.string().optional(),
    publication: z.string().optional(),
    date: z.coerce.date().optional(),
    /** Год или период, если точная дата неизвестна. */
    dateNote: z.string().optional(),
    dek: z.string(),
    sourceUrl: z.string().url().optional(),
    /** Порядок в списке: меньше — выше. */
    order: z.number().default(100),
  }),
})

export const collections = { articles }
