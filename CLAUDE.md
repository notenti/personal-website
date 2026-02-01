# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website and portfolio for nateotenti.com built with Astro (frontend) and Go (backend API).

## Commands

```bash
npm run dev      # Start Astro dev server
npm run build    # Production build
npm run preview  # Preview production build locally
```

Backend is deployed as AWS Lambda - no local backend dev server.

## Architecture

### Frontend (Astro + Tailwind)

- **Pages**: `src/pages/` - Astro pages with file-based routing
  - `index.astro` - Home page
  - `life/index.astro` - Album listing
  - `life/[...slug].astro` - Dynamic album detail pages
- **Components**: `src/components/` - Reusable Astro components
- **Content**: `src/content/albums/` - Markdown files defining photo albums with Zod-validated schema

### Photo Layout System

The `PhotoLayout.astro` component uses a 12-column grid with layout strings:
- `'full'` - Full width (col-span-12)
- `'half half'` - Two images side by side
- `'third third third'` - Three images
- `'two-thirds third'` or `'third two-thirds'` - Asymmetric
- `'quarter'` (col-span-3), `'three-quarters'` (col-span-9)

Layout array in album frontmatter maps images to rows in order. Remaining images default to full-width.

### Album Schema (`src/content/config.ts`)

```typescript
{
  title: string,
  description: string,
  date: Date,
  cover: string,           // Cover image path
  location?: string,
  blurb?: string,
  layout?: string[],       // Layout strings array
  images: Array<{
    src: string,
    date?: Date,
    place?: string,
    lat?: number,          // For map markers
    lng?: number,
  }>
}
```

### Backend (Go/Lambda)

Located in `backend/`. Gin router deployed via AWS Lambda with API Gateway.

- `GET /workouts` - Queries DynamoDB `peloton` table (params: `limit`, `duration`)
- `GET /songs` - Queries DynamoDB `spotify` table (params: `limit`)

### Styling

- Tailwind with custom theme in `tailwind.config.mjs`
- Fonts: Space Grotesk (sans), JetBrains Mono (mono)
- Mobile-first responsive design

## Git Workflow

Do not commit directly to master. Create a feature branch and merge via PR.
