import { Suspense } from 'react';
import SearchPage from '@/components/search/search-page';
import LoadingSkeleton from '@/components/search/loading-skeleton';

// SearchPage uses useSearchParams() which requires a Suspense boundary —
// this prevents the build-time prerendering error and lets the shell render
// immediately while the client-side search state hydrates.
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 px-4 py-6">
          <div className="mx-auto max-w-7xl">
            <LoadingSkeleton count={12} />
          </div>
        </div>
      }
    >
      <SearchPage />
    </Suspense>
  );
}
