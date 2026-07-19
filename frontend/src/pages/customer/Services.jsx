import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSearch, HiFilter, HiClock } from 'react-icons/hi';
import { FaScissors } from 'react-icons/fa';
import { serviceService, categoryService } from '../../services/index';
import { formatCurrency } from '../../utils/helpers';
import StarRating from '../../components/ui/StarRating';
import { CardSkeleton } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';

const Services = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ search: '', category_id: '', sort: 'created_at', order: 'DESC', page: 1 });

  useEffect(() => {
    categoryService.getAll().then(({ data }) => setCategories(data.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    serviceService.getAll({ ...filters, limit: 9 })
      .then(({ data }) => { setServices(data.data || []); setPagination(data.pagination || {}); })
      .finally(() => setLoading(false));
  }, [filters]);

  const update = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div className="min-h-screen bg-salon-bg">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Our Services</h1>
            <p className="text-gray-300 text-lg">Discover our full range of premium beauty and wellness services</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                className="input pl-10"
                placeholder="Search services..."
                value={filters.search}
                onChange={e => update('search', e.target.value)}
              />
            </div>
            <select className="input sm:w-48" value={filters.category_id} onChange={e => update('category_id', e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input sm:w-48" value={`${filters.sort}-${filters.order}`}
              onChange={e => { const [sort, order] = e.target.value.split('-'); setFilters(f => ({ ...f, sort, order, page: 1 })); }}>
              <option value="created_at-DESC">Newest First</option>
              <option value="price-ASC">Price: Low to High</option>
              <option value="price-DESC">Price: High to Low</option>
              <option value="name-ASC">Name A–Z</option>
              <option value="duration-ASC">Shortest First</option>
            </select>
          </div>
          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => update('category_id', '')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!filters.category_id ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              All
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => update('category_id', c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.category_id === c.id ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? Array(9).fill(0).map((_, i) => <CardSkeleton key={i} />) :
            services.length === 0 ? (
              <div className="col-span-3 text-center py-20 text-gray-400">
                <FaScissors className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No services found</p>
              </div>
            ) :
            services.map((svc, i) => (
              <motion.div key={svc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card hover:shadow-card-hover transition-all duration-300 group overflow-hidden p-0"
              >
                <div className="h-48 bg-gradient-to-br from-gold-100 to-gold-200 overflow-hidden">
                  {svc.image ? (
                    <img src={svc.image} alt={svc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaScissors className="w-12 h-12 text-gold-400" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <span className="text-xs text-gold-600 font-medium bg-gold-50 px-2 py-0.5 rounded-full">{svc.category_name}</span>
                  <h3 className="font-semibold text-gray-900 mt-2 mb-1">{svc.name}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{svc.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating rating={parseFloat(svc.avg_rating)} />
                    <span className="text-xs text-gray-400">({svc.review_count})</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                    <HiClock className="w-3.5 h-3.5" /> {svc.duration} minutes
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gold-600 font-bold text-xl">{formatCurrency(svc.price)}</p>
                    <Link to={`/book?service=${svc.id}`} className="btn-primary text-sm py-2 px-4">Book Now</Link>
                  </div>
                </div>
              </motion.div>
            ))
          }
        </div>

        <Pagination {...pagination} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />
      </div>
    </div>
  );
};

export default Services;
