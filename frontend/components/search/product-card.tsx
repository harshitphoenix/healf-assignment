'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { title, vendor, price, inventory, imageUrl } = product;
  const [imgError, setImgError] = useState(false);
  const inStock = inventory > 0;

  return (
    <article className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 shrink-0">
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
            <span className="text-3xl font-bold text-teal-400" aria-hidden="true">
              {title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3
          className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug"
          title={title}
        >
          {title}
        </h3>

        <p className="text-xs text-gray-500">{vendor}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold text-gray-900">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(price)}
          </span>

          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              inStock
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {inStock ? 'In stock' : 'Out of stock'}
          </span>
        </div>
      </div>
    </article>
  );
}
