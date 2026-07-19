import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { reviewService } from '../../services/index';
import { formatDate } from '../../utils/helpers';
import StarRating from '../../components/ui/StarRating';
import { CardSkeleton } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    reviewService.getAll({ approved: 'true', page, limit: 12 })
      .then(({ data }) => { setReviews(data.data || []); setPagination(data.pagination || {}); })
      .finally(() => setLoading(false));
  }, [page]);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-salon-bg">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Client Reviews</h1>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-5xl font-bold text-gold-400">{avg}</span>
              <div>
                <StarRating rating={parseFloat(avg)} size="lg" />
                <p className="text-gray-400 text-sm mt-1">{pagination.total || 0} reviews</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card hover:shadow-card-hover transition-shadow"
              >
                <StarRating rating={review.rating} />
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">"{review.comment}"</p>
                {review.service_name && (
                  <span className="badge badge-gold mt-3">{review.service_name}</span>
                )}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="w-9 h-9 bg-gold-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {review.customer_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{review.customer_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <Pagination {...pagination} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default Reviews;
