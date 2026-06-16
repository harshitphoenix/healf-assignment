import type { Product } from '@/lib/types';
import ProductCard from './product-card';
import LoadingSkeleton from './loading-skeleton';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) return <LoadingSkeleton />;

  return (
    <section
      aria-label="Search results"
      aria-live="polite"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}
