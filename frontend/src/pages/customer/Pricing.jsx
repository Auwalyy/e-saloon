import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiClock, HiCheckCircle } from 'react-icons/hi';
import { serviceService, categoryService } from '../../services/index';
import { formatCurrency } from '../../utils/helpers';
import { Spinner } from '../../components/ui/Skeleton';

const Pricing = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      serviceService.getAll({ limit: 100 }),
      categoryService.getAll(),
    ]).then(([s, c]) => {
      setServices(s.data.data || []);
      setCategories(c.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = active ? services.filter(s => s.category_id === active) : services;

  return (
    <div className="min-h-screen bg-salon-bg">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Pricing</h1>
            <p className="text-gray-300 text-lg">Transparent pricing for all our services</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button onClick={() => setActive('')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!active ? 'bg-gold-500 text-white' : 'bg-white text-gray-600 hover:bg-gold-50 border border-gray-200'}`}>
            All Services
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActive(c.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${active === c.id ? 'bg-gold-500 text-white' : 'bg-white text-gray-600 hover:bg-gold-50 border border-gray-200'}`}>
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((svc, i) => (
                  <motion.tr key={svc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{svc.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{svc.description?.slice(0, 50)}...</p>
                      </div>
                    </td>
                    <td><span className="badge badge-gold">{svc.category_name}</span></td>
                    <td>
                      <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <HiClock className="w-3.5 h-3.5" /> {svc.duration} min
                      </span>
                    </td>
                    <td><span className="font-bold text-gold-600">{formatCurrency(svc.price)}</span></td>
                    <td>
                      <Link to={`/book?service=${svc.id}`} className="btn-primary text-xs py-1.5 px-3">Book</Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-10 card bg-gold-50 border border-gold-200">
          <h3 className="font-semibold text-gray-900 mb-3">What's Included</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {['Professional consultation', 'Premium products', 'Complimentary refreshments', 'Relaxing environment', 'Expert stylists', 'Satisfaction guarantee'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <HiCheckCircle className="w-4 h-4 text-gold-500 shrink-0" /> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
