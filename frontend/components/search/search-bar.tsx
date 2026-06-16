'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}

export default function SearchBar({ value, onChange, loading }: SearchBarProps) {
  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="relative w-full"
    >
      <label htmlFor="search-input" className="sr-only">
        Search products
      </label>

      {/* Search icon */}
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </div>

      <input
        id="search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products by name, description, or brand..."
        aria-label="Search products"
        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      {/* Loading spinner or clear button */}
      <div className="absolute inset-y-0 right-3 flex items-center">
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin text-emerald-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>
    </form>
  );
}
