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
    layout: z.array(z.string()).optional(), // e.g. ['full', 'half half', 'third third third']
    images: z.array(z.object({
      src: z.string(),
      date: z.coerce.date().optional(),
      place: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })),
  }),
});

export const collections = { albums };
