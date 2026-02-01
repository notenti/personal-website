# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website and portfolio for nateotenti.com built with Astro, hosted on Vercel.

## Commands

```bash
npm run dev      # Start Astro dev server
npm run build    # Production build
npm run preview  # Preview production build locally
```

## Architecture

### Frontend (Astro + Tailwind + MDX)

- **Pages**: `src/pages/` - Astro pages with file-based routing
  - `index.astro` - Home page
  - `life/index.astro` - Album listing (auto-discovers albums from content collection)
  - `life/[slug].astro` - Dynamic album detail pages
- **Components**: `src/components/` - Reusable Astro components
- **Content**: `src/content/albums/` - MDX files defining photo albums
- **Layouts**: `src/layouts/` - Page layouts (BaseLayout, AlbumLayout)

### Album System (MDX)

Albums are single `.mdx` files in `src/content/albums/` containing both frontmatter metadata and layout:

```mdx
---
title: Hawaii 2026
date: 2026-01-18
cover: https://images.nateotenti.com/albums/hawaii-2026/cover.jpg
location: Oʻahu, Maui
intro: A week exploring the islands.
---
import Photo from '../../components/Photo.astro';
import PhotoRow from '../../components/PhotoRow.astro';
import Text from '../../components/Text.astro';

export const BASE = 'https://images.nateotenti.com/albums/hawaii-2026';

<Photo src={`${BASE}/photo1.jpg`} />

<Text>
We started our trip on Oʻahu, exploring the North Shore...
</Text>

<PhotoRow>
  <Photo src={`${BASE}/photo2.jpg`} aspect="landscape" />
  <Photo src={`${BASE}/photo3.jpg`} aspect="portrait" />
</PhotoRow>
```

### Photo Components

**`<Photo>`** - Single image with aspect ratio control
- `src` - Image URL (required)
- `aspect` - `'auto'` | `'portrait'` | `'landscape'` | `'square'` | `'16:9'` | `'4:3'` | `'3:2'` | `'2:3'` | `'3:4'`
- `caption` - Optional caption text

**`<PhotoRow>`** - Horizontal grouping of images
- `gap` - `'none'` | `'sm'` | `'md'` | `'lg'`
- `align` - `'top'` | `'center'` | `'bottom'` | `'stretch'`

**`<Text>`** - Storytelling prose between photos
- Adds vertical margin for breathing room between images
- Use for narrative text within albums

### Album Schema (`src/content/config.ts`)

```typescript
{
  title: string,
  date: Date,
  cover: string,           // Cover image URL
  location?: string,       // Single string, format as needed (e.g., "Oʻahu, Maui")
  intro?: string,          // Short intro paragraph (also used for SEO meta description)
}
```

### Image Hosting

Images are hosted on Cloudflare R2 at `images.nateotenti.com`. Upload images using rclone:

```bash
rclone sync ./photos r2:nateotenti-images/albums/album-name/
```

### Styling

- Tailwind with custom theme in `tailwind.config.mjs`
- Fonts: Space Grotesk (sans), JetBrains Mono (mono)
- Mobile-first responsive design

## Git Workflow

Do not commit directly to master. Create a feature branch and merge via PR.
