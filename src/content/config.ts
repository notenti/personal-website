import { defineCollection, z } from 'astro:content';

const albums = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    cover: z.string(),
    location: z.string().optional(),
    blurb: z.string().optional(),
  }),
});

export const collections = { albums };
