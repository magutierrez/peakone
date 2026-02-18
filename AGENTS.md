# AGENTS.md - Developer Guide for peakOne

## Project Overview

**peakOne** is a Next.js 16+ web application for outdoor enthusiasts (cyclists and hikers) that provides point-by-point meteorological and physical analysis of GPX tracks or Strava activities.

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Maps**: MapLibre GL / react-map-gl
- **Auth**: Auth.js (NextAuth) with Strava, Google, Facebook, X providers
- **i18n**: next-intl (English & Spanish)
- **Database**: PGLite (local SQL)

### Key Commands

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
/app              - Next.js App Router pages
/components       - React components (UI + features)
/hooks            - Custom React hooks
/lib              - Utilities, API clients, helpers
/messages         - i18n translation files (en.json, es.json)
/styles           - Global styles
/auth.ts          - Auth.js configuration
/proxy.ts         - API proxy utilities
```

## Important Patterns

### Component Architecture

- Use **shadcn/ui** components from `@radix/ui/react-*` packages
- Components are located in `/components/ui` and `/components`
- Use `cn()` utility from `lib/utils.ts` for className merging

### Maps Integration

- Map components use `react-map-gl` with MapLibre GL
- Map style is configured in map-related components
- GeoJSON data is used for track visualization

### API Calls

- Use `fetch` or SWR for data fetching
- External APIs: Open-Meteo (weather), Overpass API (OSM), Strava API
- Weather data is cached appropriately

### Internationalization

- All user-facing strings use `next-intl`
- Translation files in `/messages` directory
- Use `useTranslations` hook in components

### TypeScript

- Strict mode enabled
- Use proper types for all props and functions
- Avoid `any` types

## Code Style Guidelines

- Use functional components with hooks
- Follow existing naming conventions
- Run `pnpm format` before committing
- Run `pnpm lint` to check for errors

## Testing

Run tests with appropriate test commands (if configured). Always verify changes don't break the build.
