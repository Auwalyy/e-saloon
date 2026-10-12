import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiChevronLeft, HiChevronRight, HiOutlinePhotograph, HiX } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { galleryService } from '../../services';
import { mediaUrl } from '../../services/api';
import { cleanParams } from '../../utils/helpers';
import PageHero from '../../components/common/PageHero';
import SmartImage from '../../components/ui/SmartImage';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

const CATEGORIES = ['Hair', 'Braids', 'Facials', 'Spa', 'Makeup', 'Pedicure'];

/** Photo gallery filtered by category, with a keyboard-friendly lightbox. */
const Gallery = () => {
  const [category, setCategory] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const { data, loading } = useFetch(() => galleryService.getAll(cleanParams({ category, limit: 60 })), [category]);

  const items = data?.data || [];
  const active = items[activeIndex];

  // Arrow keys and Escape control the lightbox.
  useEffect(() => {
    if (activeIndex < 0) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setActiveIndex(-1);
      if (event.key === 'ArrowRight') setActiveIndex((index) => (index + 1) % items.length);
      if (event.key === 'ArrowLeft') setActiveIndex((index) => (index - 1 + items.length) % items.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeIndex, items.length]);

  return (
    <>
      <PageHero eyebrow="Our work" title="Gallery" subtitle="Browse recent looks and treatments from our stylists." />

      <section className="container-page py-10">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-6 justify-start md:justify-center" role="tablist" aria-label="Gallery categories">
          {['', ...CATEGORIES].map((item) => (
            <button
              key={item || 'all'}
              type="button"
              role="tab"
              aria-selected={category === item}
              onClick={() => setCategory(item)}
              className={`tab ${category === item ? 'tab-active' : 'bg-white shadow-sm'}`}
            >
              {item || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="aspect-square" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={HiOutlinePhotograph} title="No photos in this category yet" message="Please check back soon." />
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setActiveIndex(index)}
                  className="group relative rounded-2xl overflow-hidden shadow-card text-left"
                  aria-label={`Open ${item.title || item.category}`}
                >
                  <SmartImage src={item.image} alt={item.title || item.category} className="aspect-square" imgClassName="group-hover:scale-110 !transition-all !duration-500" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pt-10 pb-3 text-white">
                    <span className="block text-sm font-medium">{item.title || item.category}</span>
                    <span className="block text-xs text-white/70">{item.category}</span>
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={active.title || active.category}
            onClick={() => setActiveIndex(-1)}
          >
            <button type="button" className="absolute top-4 right-4 text-white/80 hover:text-white p-2" aria-label="Close" onClick={() => setActiveIndex(-1)}>
              <HiX className="w-7 h-7" />
            </button>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  className="absolute left-2 sm:left-6 text-white/80 hover:text-white p-2"
                  onClick={(event) => { event.stopPropagation(); setActiveIndex((activeIndex - 1 + items.length) % items.length); }}
                >
                  <HiChevronLeft className="w-9 h-9" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  className="absolute right-2 sm:right-6 text-white/80 hover:text-white p-2"
                  onClick={(event) => { event.stopPropagation(); setActiveIndex((activeIndex + 1) % items.length); }}
                >
                  <HiChevronRight className="w-9 h-9" />
                </button>
              </>
            )}
            <motion.figure key={active.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-4xl w-full" onClick={(event) => event.stopPropagation()}>
              <img src={mediaUrl(active.image)} alt={active.title || active.category} className="max-h-[78vh] w-full object-contain rounded-xl" />
              <figcaption className="text-center text-white mt-4">
                <span className="font-medium">{active.title || active.category}</span>
                <span className="text-white/60"> · {active.category} · {activeIndex + 1} of {items.length}</span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Gallery;
