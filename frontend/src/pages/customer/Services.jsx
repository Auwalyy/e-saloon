import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineScissors } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { serviceService, categoryService } from '../../services';
import { cleanParams } from '../../utils/helpers';
import PageHero from '../../components/common/PageHero';
import ServiceCard from '../../components/common/ServiceCard';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { CardGridSkeleton } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/ui/Motion';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'duration_asc', label: 'Duration: shortest first' },
  { value: 'duration_desc', label: 'Duration: longest first' },
  { value: 'newest', label: 'Newest' },
];

const PRICE_RANGES = [
  { value: '', label: 'Any price' },
  { value: '0-10000', label: 'Under ₦10,000' },
  { value: '10000-20000', label: '₦10,000 - ₦20,000' },
  { value: '20000-40000', label: '₦20,000 - ₦40,000' },
  { value: '40000-', label: 'Over ₦40,000' },
];

/** Service catalogue with search, category and price filters, sorting and pagination. */
const Services = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [priceRange, setPriceRange] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const categories = useFetch(() => categoryService.getAll());

  const [minPrice, maxPrice] = priceRange.split('-');
  const { data, loading, error, refetch } = useFetch(
    () => serviceService.getAll(cleanParams({ search: debouncedSearch, category, minPrice, maxPrice, sort, page, limit: 9 })),
    [debouncedSearch, category, priceRange, sort, page]
  );

  // Any filter change returns to the first page and keeps the URL shareable.
  useEffect(() => {
    setPage(1);
    setParams(cleanParams({ search: debouncedSearch, category }), { replace: true });
  }, [debouncedSearch, category, priceRange, sort, setParams]);

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setPriceRange('');
    setSort('name');
  };

  const services = data?.data || [];
  const hasFilters = search || category || priceRange;

  return (
    <>
      <PageHero eyebrow="What we offer" title="Our Services" subtitle="Find the perfect treatment, then book it in a few clicks." />

      <section className="container-page py-10">
        {/* Search, filter and sort */}
        <div className="card !p-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search services..." />
          <select value={priceRange} onChange={(event) => setPriceRange(event.target.value)} className="input md:w-52" aria-label="Filter by price">
            {PRICE_RANGES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="input md:w-56" aria-label="Sort services">
            {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>Sort: {option.label}</option>)}
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-5" role="tablist" aria-label="Categories">
          <button type="button" role="tab" aria-selected={!category} onClick={() => setCategory('')} className={`tab ${!category ? 'tab-active' : 'bg-white shadow-sm'}`}>
            All
          </button>
          {(categories.data?.data || []).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={category === item.slug}
              onClick={() => setCategory(item.slug)}
              className={`tab ${category === item.slug ? 'tab-active' : 'bg-white shadow-sm'}`}
            >
              {item.name} <span className="opacity-70">({item.serviceCount})</span>
            </button>
          ))}
        </div>

        {loading && <CardGridSkeleton count={6} />}
        {!loading && error && (
          <EmptyState title="We could not load the services" message={error} action={<Button onClick={refetch}>Try again</Button>} />
        )}
        {!loading && !error && services.length === 0 && (
          <EmptyState
            icon={HiOutlineScissors}
            title="No services match your search"
            message="Try a different keyword or clear the filters."
            action={hasFilters && <Button variant="secondary" onClick={resetFilters}>Clear filters</Button>}
          />
        )}
        {!loading && !error && services.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">{data.pagination.total} service{data.pagination.total === 1 ? '' : 's'} found</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <Reveal key={service.id} delay={index * 0.04}><ServiceCard service={service} /></Reveal>
              ))}
            </div>
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
      </section>
    </>
  );
};

export default Services;
