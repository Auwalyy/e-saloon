import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

/**
 * Pager driven by the `pagination` object returned by the API
 * (`{ page, pages, total, limit }`).
 */
const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Up to five page numbers centred on the current page.
  const first = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, index) => first + index);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <p className="text-sm text-gray-500">Showing {start}-{end} of {total}</p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="icon-btn" aria-label="Previous page">
          <HiChevronLeft className="w-4 h-4" />
        </button>
        {numbers.map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            aria-current={number === page ? 'page' : undefined}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              number === page ? 'bg-gold-500 text-salon-dark' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {number}
          </button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page === pages} className="icon-btn" aria-label="Next page">
          <HiChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
