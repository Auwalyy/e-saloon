import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineClock, HiOutlineTag } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { serviceService } from '../../services';
import { formatCurrency, formatDuration } from '../../utils/helpers';
import PageHero from '../../components/common/PageHero';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/ui/Motion';

/** Price list: every service grouped by category, cheapest first. */
const Pricing = () => {
  const { data, loading, error, refetch } = useFetch(() => serviceService.getAll({ limit: 100, sort: 'price_asc' }));

  const groups = useMemo(() => {
    const byCategory = new Map();
    (data?.data || []).forEach((service) => {
      const name = service.category?.name || 'Other';
      if (!byCategory.has(name)) byCategory.set(name, []);
      byCategory.get(name).push(service);
    });
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <>
      <PageHero eyebrow="Transparent pricing" title="Price List" subtitle="No hidden charges. The price you see is the price you pay." />

      <section className="container-page py-12">
        {loading && (
          <div className="grid gap-6 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}</div>
        )}
        {!loading && error && (
          <EmptyState icon={HiOutlineTag} title="We could not load the price list" message={error} action={<Button onClick={refetch}>Try again</Button>} />
        )}
        {!loading && !error && groups.length === 0 && (
          <EmptyState icon={HiOutlineTag} title="No services have been added yet" message="Prices appear here as soon as the salon adds its services." />
        )}

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          {groups.map(([category, services], index) => (
            <Reveal key={category} delay={index * 0.05}>
              <div className="card">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                  <span className="badge-gold">From {formatCurrency(services[0].price)}</span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {services.map((service) => (
                    <li key={service.id} className="py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <HiOutlineClock className="w-4 h-4" /> {formatDuration(service.duration)}
                        </p>
                      </div>
                      <p className="font-bold text-gold-700 whitespace-nowrap">{formatCurrency(service.price)}</p>
                      <Link to={`/book?service=${service.id}`} className="btn-outline !text-xs !px-3 !py-1.5">Book</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {!loading && groups.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-10">
            Prices are in Nigerian Naira (₦). Long or very thick hair may attract a small extra charge, which your stylist
            will confirm before starting.
          </p>
        )}
      </section>
    </>
  );
};

export default Pricing;
