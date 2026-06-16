import type { ProductsResponse } from '@/lib/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`API error: ${status}`);
    this.name = 'ApiError';
  }
}

export interface FetchProductsParams {
  q?: string;
  vendor?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchProducts(
  params: FetchProductsParams,
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  const url = new URL('/api/products', BASE);

  if (params.q) url.searchParams.set('q', params.q);
  if (params.vendor) url.searchParams.set('vendor', params.vendor);
  if (params.minPrice) url.searchParams.set('minPrice', params.minPrice);
  if (params.maxPrice) url.searchParams.set('maxPrice', params.maxPrice);
  if (params.availability) url.searchParams.set('availability', params.availability);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.pageSize) url.searchParams.set('pageSize', String(params.pageSize));

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<ProductsResponse>;
}

export async function fetchVendors(): Promise<string[]> {
  const url = new URL('/api/products/vendors', BASE);
  const res = await fetch(url.toString());
  if (!res.ok) throw new ApiError(res.status);
  const data = (await res.json()) as { vendors: string[] };
  return data.vendors;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400) return 'Invalid search parameters. Please reset your filters.';
    if (err.status === 503) return 'Product catalog is temporarily unavailable.';
  }
  return 'Unable to load products. Please try again.';
}
