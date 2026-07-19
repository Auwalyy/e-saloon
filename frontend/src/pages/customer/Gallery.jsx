import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX } from 'react-icons/hi';
import { galleryService } from '../../services/index';
import { Spinner } from '../../components/ui/Skeleton';

const CATEGORIES = ['all', 'hair', 'braids', 'facials', 'spa', 'makeup', 'pedicure'];

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [active, setActive] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    galleryService.getAll().then(({ data }) => {
      setImages(data.data || []);
      setFiltered(data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const filter = (cat) => {
    setActive(cat);
    setFiltered(cat === 'all' ? images : images.filter(img => img.category === cat));
  };

  return (
    <div className="min-h-screen bg-salon-bg">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Our Gallery</h1>
            <p className="text-gray-300 text-lg">A showcase of our finest work</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => filter(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200 ${active === cat ? 'bg-gold-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gold-50 hover:text-gold-600 shadow-sm'}`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">No images in this category yet</p>
        ) : (
          <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            <AnimatePresence>
              {filtered.map((img, i) => (
                <motion.div key={img.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                  className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-2xl shadow-card hover:shadow-card-hover transition-shadow"
                  onClick={() => setLightbox(img)}
                >
                  <img src={img.image_url} alt={img.title || img.category} className="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                    <div className="p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <span className="text-white text-sm font-medium capitalize bg-gold-500/80 px-2 py-0.5 rounded-full">{img.category}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
              <HiX className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              src={lightbox.image_url} alt={lightbox.title}
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
