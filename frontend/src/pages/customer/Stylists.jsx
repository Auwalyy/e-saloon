import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSearch } from 'react-icons/hi';
import { employeeService } from '../../services/index';
import StarRating from '../../components/ui/StarRating';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { DAYS } from '../../utils/helpers';

const Stylists = () => {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    employeeService.getAll({ search }).then(({ data }) => setStylists(data.data || [])).finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="min-h-screen bg-salon-bg">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Our Stylists</h1>
            <p className="text-gray-300 text-lg">Meet the talented team behind every transformation</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto mb-10 relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="input pl-10" placeholder="Search stylists..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />) :
            stylists.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="card hover:shadow-card-hover transition-shadow text-center"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-gold-100">
                  {s.avatar ? (
                    <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gold-500 flex items-center justify-center text-white text-3xl font-bold">{s.name?.[0]}</div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{s.name}</h3>
                <p className="text-gold-600 text-sm font-medium mt-1">{s.specialization}</p>
                <p className="text-gray-400 text-xs mt-1">{s.experience_years} years experience</p>
                <div className="flex justify-center mt-2">
                  <StarRating rating={parseFloat(s.avg_rating)} />
                  <span className="text-xs text-gray-400 ml-1">({s.review_count})</span>
                </div>
                {s.bio && <p className="text-gray-500 text-xs mt-3 line-clamp-2">{s.bio}</p>}
                <Link to={`/book?employee=${s.id}`} className="btn-primary w-full mt-4 text-sm py-2.5">Book Appointment</Link>
              </motion.div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default Stylists;
