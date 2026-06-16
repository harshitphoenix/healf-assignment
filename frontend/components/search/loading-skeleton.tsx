function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  count?: number;
}

export default function LoadingSkeleton({ count = 12 }: LoadingSkeletonProps) {
  return (
    <div
      aria-label="Loading products"
      aria-busy="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
