'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchProducts, fetchVendors, getErrorMessage } from '@/lib/api-client';
import type { Product, ResponseMeta } from '@/lib/types';
import SearchBar from './search-bar';
import FilterPanel from './filter-panel';
import ProductGrid from './product-grid';
import Pagination from './pagination';
import EmptyState from './empty-state';
import ErrorBanner from './error-banner';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read all filter state from URL — URL is the single source of truth
  const q = searchParams.get('q') ?? '';
  const vendor = searchParams.get('vendor') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const availability = searchParams.get('availability') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  // Local input value for the search bar — updated immediately for responsive UX;
  // pushed to the URL with a 400ms debounce so API calls are not made on every keystroke
  const [inputValue, setInputValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ResponseMeta | null>(null);
  const [vendors, setVendors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Focus management: move focus to result count after user-triggered searches
  const resultsRef = useRef<HTMLParagraphElement>(null);
  const hasInteracted = useRef(false);

  // Keep local input in sync when the URL q param changes externally
  // (e.g. browser back/forward, or clear-all filters)
  useEffect(() => {
    setInputValue(q);
  }, [q]);

  // Move focus to result count after search completes, but only after user interaction
  // (not on initial page load)
  useEffect(() => {
    if (!loading && hasInteracted.current && resultsRef.current) {
      resultsRef.current.focus();
    }
  }, [loading]);

  // Debounced search: update URL after 400ms of no typing.
  // Reads window.location.search at fire time so stale closures never
  // overwrite an intervening filter change.
  const handleQueryChange = useCallback(
    (value: string) => {
      hasInteracted.current = true;
      setInputValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        if (value) params.set('q', value);
        else params.delete('q');
        params.set('page', '1');
        router.replace(`/?${params.toString()}`, { scroll: false });
      }, 400);
    },
    [router],
  );

  // Immediate URL update for all non-text filters.
  // Also reads the live URL so concurrent q debounce won't be lost.
  const handleFilterChange = useCallback(
    (filters: { vendor?: string; minPrice?: string; maxPrice?: string; availability?: string }) => {
      hasInteracted.current = true;
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.set('page', '1');
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      hasInteracted.current = true;
      const params = new URLSearchParams(window.location.search);
      params.set('page', String(newPage));
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const handleRetry = useCallback(() => {
    router.replace(`/?${searchParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Fetch vendor list once on mount (non-critical)
  useEffect(() => {
    fetchVendors()
      .then(setVendors)
      .catch(() => {
        // Non-fatal — filter dropdown degrades to empty
      });
  }, []);

  // Fetch products whenever any URL filter param changes.
  // AbortController cancels the in-flight request when params change before it resolves,
  // preventing stale responses from overwriting newer results.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchProducts({ q, vendor, minPrice, maxPrice, availability, page }, controller.signal)
      .then((res) => {
        setProducts(res.products);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(getErrorMessage(err));
        setProducts([]);
        setMeta(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, [q, vendor, minPrice, maxPrice, availability, page]);

  const isEmpty = !loading && !error && meta?.totalResults === 0;
  const showPagination = !loading && !error && meta && meta.totalPages > 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky search header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-3 text-xl font-bold text-gray-900">Healf Product Search</h1>
          <SearchBar value={inputValue} onChange={handleQueryChange} loading={loading} />
        </div>
      </header>

      {/* Page main — wraps both sidebar and results for correct landmark semantics */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Mobile filters — shown above results on small screens */}
        <div className="mb-6 lg:hidden">
          <FilterPanel
            vendors={vendors}
            selectedVendor={vendor}
            minPrice={minPrice}
            maxPrice={maxPrice}
            availability={availability}
            onChange={handleFilterChange}
          />
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar — FilterPanel renders its own <aside> landmark */}
          <div className="hidden w-56 shrink-0 lg:block">
            <FilterPanel
              vendors={vendors}
              selectedVendor={vendor}
              minPrice={minPrice}
              maxPrice={maxPrice}
              availability={availability}
              onChange={handleFilterChange}
            />
          </div>

          {/* Results column */}
          <div className="flex-1 min-w-0">
            {error && <ErrorBanner message={error} onRetry={handleRetry} />}

            {!error && (
              <>
                {/* Result count — aria-live announces changes; tabIndex allows programmatic focus */}
                <p
                  ref={resultsRef}
                  tabIndex={-1}
                  aria-live="polite"
                  aria-atomic="true"
                  className="mb-4 text-sm text-gray-500 focus:outline-none"
                >
                  {meta && !loading
                    ? `${meta.totalResults.toLocaleString()} ${meta.totalResults === 1 ? 'product' : 'products'} found`
                    : ' '}
                </p>

                <ProductGrid products={products} loading={loading} />

                {isEmpty && <EmptyState />}

                {showPagination && (
                  <Pagination
                    page={meta.page}
                    totalPages={meta.totalPages}
                    onChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
