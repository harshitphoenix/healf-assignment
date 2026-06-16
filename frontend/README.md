# Healf Product Search — Frontend

Next.js 16 App Router UI for the Healf product search application.
Talks to the Express backend at `NEXT_PUBLIC_API_URL`; never imports backend code directly.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4**
- **TypeScript** (strict)

## Getting started

```bash
# From the repo root (starts both backend and frontend)
npm run dev

# Frontend only
npm run dev --prefix frontend
```

Runs at [http://localhost:3000](http://localhost:3000). Requires the backend on port 3001.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API base URL |

Set in `frontend/.env.local` (already present for local dev).

## Scripts

```bash
npm run dev          # Development server with hot reload
npm run build        # Production build
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run format       # Prettier check
npm run format:fix   # Prettier write
```

## Key components

| Component | Role |
|---|---|
| `app/page.tsx` | Server component; wraps `SearchPage` in `<Suspense>` |
| `components/search/search-page.tsx` | Orchestrator — URL state, debounce, AbortController |
| `components/search/filter-panel.tsx` | Sidebar filters; renders its own `<aside>` landmark |
| `components/search/product-grid.tsx` | Responsive grid with `aria-live` result announcements |
| `lib/api-client.ts` | `fetchProducts()` and `fetchVendors()` with typed errors |

## Architecture notes

All filter state lives in the URL query string — deep linking and browser back/forward work for free.
The search input debounces 400ms before updating the URL; all other filters update immediately.
`AbortController` cancels in-flight requests when params change before a response arrives.
