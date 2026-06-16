'use client';

import { useEffect, useState } from 'react';

interface FilterValues {
  vendor?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: string;
}

interface FilterPanelProps {
  vendors: string[];
  selectedVendor: string;
  minPrice: string;
  maxPrice: string;
  availability: string;
  onChange: (filters: FilterValues) => void;
}

export default function FilterPanel({
  vendors,
  selectedVendor,
  minPrice,
  maxPrice,
  availability,
  onChange,
}: FilterPanelProps) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  // Sync local price state when URL params change (e.g. browser back/forward)
  useEffect(() => { setLocalMin(minPrice); }, [minPrice]);
  useEffect(() => { setLocalMax(maxPrice); }, [maxPrice]);

  const hasFilters = selectedVendor || minPrice || maxPrice || availability;

  const handlePriceBlur = () => {
    onChange({ vendor: selectedVendor, minPrice: localMin, maxPrice: localMax, availability });
  };

  const handleReset = () => {
    setLocalMin('');
    setLocalMax('');
    onChange({ vendor: '', minPrice: '', maxPrice: '', availability: '' });
  };

  return (
    <aside aria-label="Search filters" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Filters</h2>
        {hasFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-emerald-600 hover:underline focus:outline-none"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Vendor */}
      <div>
        <label htmlFor="vendor-select" className="mb-1.5 block text-xs font-medium text-gray-700">
          Brand / Vendor
        </label>
        <select
          id="vendor-select"
          value={selectedVendor}
          onChange={(e) =>
            onChange({
              vendor: e.target.value,
              minPrice: localMin,
              maxPrice: localMax,
              availability,
            })
          }
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All brands</option>
          {vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-gray-700">Price range (USD)</legend>
        <div className="flex items-center gap-2">
          <label htmlFor="min-price" className="sr-only">
            Minimum price
          </label>
          <input
            id="min-price"
            type="number"
            min={0}
            step="0.01"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            onBlur={handlePriceBlur}
            placeholder="Min"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-gray-400 text-sm shrink-0">—</span>
          <label htmlFor="max-price" className="sr-only">
            Maximum price
          </label>
          <input
            id="max-price"
            type="number"
            min={0}
            step="0.01"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            onBlur={handlePriceBlur}
            placeholder="Max"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </fieldset>

      {/* Availability */}
      <div className="flex items-center gap-3">
        <input
          id="availability"
          type="checkbox"
          checked={availability === 'true'}
          onChange={(e) =>
            onChange({
              vendor: selectedVendor,
              minPrice: localMin,
              maxPrice: localMax,
              availability: e.target.checked ? 'true' : '',
            })
          }
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="availability" className="text-sm text-gray-700 cursor-pointer select-none">
          In stock only
        </label>
      </div>
    </aside>
  );
}
