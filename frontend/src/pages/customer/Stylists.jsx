import { useState } from 'react';
import { HiOutlineUserGroup } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { employeeService } from '../../services';
import { cleanParams } from '../../utils/helpers';
import PageHero from '../../components/common/PageHero';
import StylistCard from '../../components/common/StylistCard';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import { CardGridSkeleton } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/ui/Motion';

/** Team page: every active stylist with experience, specialisation, working days and rating. */
const Stylists = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const { data, loading } = useFetch(
    () => employeeService.getAll(cleanParams({ search: debouncedSearch, limit: 50 })),
    [debouncedSearch]
  );
  const stylists = data?.data || [];

  return (
    <>
      <PageHero eyebrow="Our team" title="Meet Our Stylists" subtitle="Skilled, friendly professionals ready to look after you." />

      <section className="container-page py-10">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or specialisation..." className="max-w-md mx-auto mb-8" />

        {loading ? (
          <CardGridSkeleton count={6} />
        ) : stylists.length === 0 ? (
          <EmptyState icon={HiOutlineUserGroup} title="No stylists found" message="Try a different search term." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stylists.map((stylist, index) => (
              <Reveal key={stylist.id} delay={index * 0.05}><StylistCard stylist={stylist} /></Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default Stylists;
