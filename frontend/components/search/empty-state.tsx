export default function EmptyState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-4 text-5xl text-gray-300" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-700">No products found</h2>
      <p className="mt-1 text-sm text-gray-500">
        No products found matching your search criteria.
      </p>
      <p className="mt-1 text-sm text-gray-400">Try adjusting your filters or search terms.</p>
    </div>
  );
}
