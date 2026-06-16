# Healf Product Search

A full-stack health supplement search application built as a split-stack take-home.
The Express API owns all business logic; the Next.js frontend is a pure UI consumer.

---

## How to run

**Prerequisites:** Node.js 20+

```bash
# Install all dependencies
npm ci --prefix backend
npm ci --prefix frontend

# Start both servers concurrently (backend :3001, frontend :3000)
npm run dev
```

The frontend reads `NEXT_PUBLIC_API_URL` from `frontend/.env.local` (already committed as `http://localhost:3001`).
To point the backend at a different CSV, set `PRODUCTS_CSV_PATH` before starting.

### Individual servers

```bash
# Backend only
npm run dev --prefix backend

# Frontend only
npm run dev --prefix frontend
```

### Other scripts

```bash
npm run typecheck          # Type-check both packages
npm run test               # Run backend test suite (43 tests)
npm run test:coverage --prefix backend   # Coverage report (≥80% threshold)
npm run benchmark --prefix backend       # p95 latency assert < 300ms
```

---

## Architecture

```
healf-product-search/
├── backend/          Express API — CSV ingestion, search, pagination
│   ├── src/
│   │   ├── repository/     CsvRepository (implements ProductRepository)
│   │   ├── cache/          CatalogCache (eager load) + SearchCache (5-min TTL)
│   │   ├── services/       SearchService — filter, sort, paginate
│   │   ├── middleware/      validateQuery, requestLogger, errorHandler
│   │   └── routes/         GET /api/products, /api/products/vendors, /api/health
│   └── __tests__/    Vitest unit + Supertest integration tests
└── frontend/         Next.js 16 App Router — search UI
    ├── app/          Root layout + page (Suspense boundary)
    ├── components/   SearchBar, FilterPanel, ProductGrid, Pagination, …
    └── lib/          api-client, types
```

**Request path:** `SearchBar → URL params → fetchProducts() → GET /api/products → SearchService → CatalogCache → in-memory filter/sort/slice → JSON`

**Layer contract:** `SearchService` depends on `ProductRepository` (interface), not `CsvRepository` (implementation). Swapping to a Shopify GraphQL source means writing one new class — no changes to routes, middleware, or frontend.

---

## API contract

### `GET /api/products`

| Param | Type | Default | Constraint |
|---|---|---|---|
| `q` | string | — | max 200 chars; AND-token match across title, description, vendor |
| `vendor` | string | — | exact match, case-insensitive |
| `minPrice` | number | — | ≥ 0 |
| `maxPrice` | number | — | ≥ minPrice |
| `availability` | `true` \| `false` | — | filters by `inventory > 0` |
| `page` | integer | 1 | ≥ 1 |
| `pageSize` | integer | 20 | 1–100 |

**200 response:**
```json
{
  "products": [
    {
      "id": "1",
      "title": "Omega-3 Fish Oil",
      "description": "Heart health support",
      "vendor": "Nordic Naturals",
      "price": 29.99,
      "inventory": 150,
      "imageUrl": "https://..."
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalResults": 42, "totalPages": 3 }
}
```

**Error responses:** `400 { error: "Invalid request" }` on bad params · `503 { error: "..." }` when catalog not loaded

### `GET /api/products/vendors`

Returns `{ vendors: string[] }` sorted alphabetically. Used to populate the vendor dropdown.

### `GET /api/health`

Returns `{ status: "ok", productCount: N }` or `503` if the catalog hasn't loaded.

---

## Decisions I'm proud of

**Repository interface for Shopify swap.**
`SearchService` takes a `ProductRepository` interface with a single `getAll()` method.
The CI passes today against a CSV; a `ShopifyProductRepository` pointing at the Storefront API
would drop in without touching a line of search logic. This is the most interview-ready decision
in the codebase because it's easy to explain and the value is immediately obvious.

**URL as single source of truth.**
All filter state lives in query params. Sharing a URL deep-links to the exact result set.
Browser back/forward work for free. The debounce reads `window.location.search` at fire time
rather than from the React closure, so a filter change that arrives before the 400ms timeout
isn't silently dropped.

**Fail soft on data, fail hard on validation.**
Invalid CSV rows are skipped with a warning — one corrupt product doesn't crash the catalog.
But an API caller passing `pageSize=101` gets an immediate 400. These are different failure modes:
CSV is internal state we control over time; API params are untrusted external input.

**Deterministic sort.**
Results sort by title ascending, then ID ascending. No random ordering across pages means
paginating through results is stable and testable.

---

## Decisions I'm uncertain about

**AND vs OR multi-word search.**
`"omega fish"` requires both tokens to appear somewhere in the product (across title, description, or vendor combined). This feels more like a filter than a search — users who type two words probably want both, but it will surprise anyone expecting Google-style OR. If conversion data showed people use multi-word queries and get zero results, I'd switch to OR and boost by match count.

**Eager CSV load at startup.**
The entire catalog loads into memory before the server starts accepting traffic. For 20 products this is ideal. At 500k rows this blocks startup and may OOM. The right fix at that scale is lazy pagination from OpenSearch, not smarter CSV loading.

**In-memory search cache keyed on params.**
The cache reduces CPU cost for repeated identical queries. It doesn't help for pagination (each page is a cache miss) and adds memory pressure for pathological query spaces. At this data size the hit rate for real traffic is probably near zero — this is infrastructure for a scale that doesn't exist yet.

---

## What I left out and why

| Item | Reason |
|---|---|
| Fuzzy search / typo tolerance | Requires OpenSearch or a client-side index; AND-token search handles the core use case |
| Authentication | Out of scope — public catalog browsing |
| Rate limiting | No auth, no abuse surface on a local take-home |
| Redis / shared cache | In-memory is correct for a single instance |
| Shared `@healf/types` workspace package | Time box; types are mirrored manually between packages |
| Infinite scroll | Pagination is specified in FR-7 |
| Frontend tests | Backend search logic is where the complexity lives; Supertest covers the contract the frontend depends on |

---

## Caching — when and where

| Layer | Strategy | TTL |
|---|---|---|
| Catalog cache | Eager load at startup; periodic refresh every 15 min | — |
| Search result cache | In-memory, keyed on all params (normalised lowercase) | 5 min |
| Static assets | Next.js builds to `/.next/static`; deployable behind CDN | CDN default |

The catalog cache uses `setInterval(...).unref()` so the timer never blocks a clean process exit.
The search cache evicts on get, not on a timer, so memory stays bounded to however many distinct queries arrive in a 5-minute window.

---

## At 500k products, what breaks first

1. **O(n) linear scan.** `SearchService` iterates every product on every cache miss. At 500k with a 5% hit rate this is slow.
2. **Memory.** 500k products × ~400 bytes each ≈ 200 MB just for the catalog. Heap pressure degrades GC performance.
3. **Startup time.** Reading and parsing a 500k-row CSV blocks the event loop for several seconds.

**Mitigations:**
- Replace `CsvRepository` + `SearchService` with `OpenSearchRepository` — full-text index handles AND/OR queries, facets, and sorting at scale. `SearchService` interface is unchanged.
- Replace in-memory search cache with Redis for multi-instance deployments.
- Switch to cursor pagination (OpenSearch `search_after`) to avoid deep-offset cost.
- Stream CSV → Kafka → OpenSearch on ingestion instead of reading at startup.

---

## Shopify GraphQL redesign

The only change is a new `ShopifyProductRepository` implementing `ProductRepository`:

```typescript
class ShopifyProductRepository implements ProductRepository {
  async getAll(): Promise<Product[]> {
    // Paginate through Storefront API using cursor-based pagination
    // Map Shopify product shape → internal Product type
    // Handle rate limits with exponential backoff
  }
}
```

`CatalogCache`, `SearchService`, and every route stay identical.
The periodic refresh (`startPeriodicRefresh`) becomes a webhook listener for `products/update` events instead of a polling interval.
