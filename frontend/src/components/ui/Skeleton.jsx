/** Loading placeholders: skeleton blocks, spinner and full-page loader. */

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;

export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-card overflow-hidden">
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export const CardGridSkeleton = ({ count = 6, className = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' }) => (
  <div className={className}>
    {Array.from({ length: count }, (_, index) => <CardSkeleton key={index} />)}
  </div>
);

export const TableSkeleton = ({ rows = 6, cols = 5 }) => (
  <div className="table-container">
    <table className="table">
      <thead>
        <tr>{Array.from({ length: cols }, (_, i) => <th key={i}><Skeleton className="h-3 w-20" /></th>)}</tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, i) => (
          <tr key={i}>{Array.from({ length: cols }, (_, j) => <td key={j}><Skeleton className="h-4 w-full" /></td>)}</tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const StatsSkeleton = ({ count = 4 }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="card space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-32" />
      </div>
    ))}
  </div>
);

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <svg className={`animate-spin text-gold-500 ${sizes[size]}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
};

export const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-500 font-medium">Loading...</p>
    </div>
  </div>
);
