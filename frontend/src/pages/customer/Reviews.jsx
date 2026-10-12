import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineChatAlt2 } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { reviewService, appointmentService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { cleanParams, formatDate } from '../../utils/helpers';
import PageHero from '../../components/common/PageHero';
import ReviewCard from '../../components/common/ReviewCard';
import ReviewModal from '../../components/common/ReviewModal';
import StarRating from '../../components/ui/StarRating';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/ui/Motion';

/** Public reviews with a rating breakdown. Signed-in customers can review their completed visits. */
const Reviews = () => {
  const { user, isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState('');
  const [reviewing, setReviewing] = useState(null);

  const { data, loading } = useFetch(() => reviewService.getAll(cleanParams({ page, limit: 9, rating })), [page, rating]);

  // Completed visits this customer has not reviewed yet.
  const isCustomer = Boolean(user) && !isAdmin;
  const visits = useFetch(
    () => (isCustomer ? appointmentService.getAll({ status: 'completed', limit: 20 }) : Promise.resolve({ data: [] })),
    [isCustomer]
  );
  const awaitingReview = (visits.data?.data || []).filter((appointment) => !appointment.hasReview);

  const summary = data?.summary;
  const reviews = data?.data || [];

  return (
    <>
      <PageHero eyebrow="Testimonials" title="Customer Reviews" subtitle="Honest feedback from clients after their appointments." />

      <section className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr] items-start">
          {/* Summary and filters */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="card text-center">
              {summary ? (
                <>
                  <p className="text-5xl font-serif font-bold text-gray-900">{summary.average.toFixed(1)}</p>
                  <div className="flex justify-center mt-2"><StarRating rating={summary.average} size="md" /></div>
                  <p className="text-sm text-gray-500 mt-1">Based on {summary.count} review{summary.count === 1 ? '' : 's'}</p>
                  <ul className="mt-5 space-y-1.5">
                    {summary.distribution.map((row) => {
                      const percent = summary.count ? Math.round((row.count / summary.count) * 100) : 0;
                      const isActive = rating === String(row.rating);
                      return (
                        <li key={row.rating}>
                          <button
                            type="button"
                            onClick={() => { setRating(isActive ? '' : String(row.rating)); setPage(1); }}
                            aria-pressed={isActive}
                            className={`w-full flex items-center gap-2 text-sm px-2 py-1 rounded-lg transition-colors ${isActive ? 'bg-gold-50' : 'hover:bg-gray-50'}`}
                          >
                            <span className="w-12 text-left text-gray-600">{row.rating} star</span>
                            <span className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <span className="block h-full bg-gold-500 rounded-full" style={{ width: `${percent}%` }} />
                            </span>
                            <span className="w-8 text-right text-gray-500">{row.count}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {rating && (
                    <button type="button" onClick={() => setRating('')} className="text-xs text-gold-700 font-medium mt-3 hover:underline">
                      Show all ratings
                    </button>
                  )}
                </>
              ) : (
                <Skeleton className="h-56" />
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold text-gray-900 font-sans">Share your experience</h2>
              {!user && (
                <>
                  <p className="text-sm text-gray-500 mt-2">Sign in to review a completed appointment.</p>
                  <Link to="/login" state={{ from: { pathname: '/reviews' } }} className="btn-primary w-full mt-4 !py-2.5 !text-sm">Sign in</Link>
                </>
              )}
              {isCustomer && awaitingReview.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  You can leave a review after each completed appointment. <Link to="/book" className="text-gold-700 font-medium hover:underline">Book a visit</Link>
                </p>
              )}
              {isCustomer && awaitingReview.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {awaitingReview.slice(0, 4).map((appointment) => (
                    <li key={appointment.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="block font-medium text-gray-900 truncate">{appointment.service?.name}</span>
                        <span className="block text-xs text-gray-500">{formatDate(appointment.date)}</span>
                      </span>
                      <Button size="sm" variant="secondary" onClick={() => setReviewing(appointment)}>Review</Button>
                    </li>
                  ))}
                </ul>
              )}
              {isAdmin && <p className="text-sm text-gray-500 mt-2">Reviews are moderated from the admin dashboard.</p>}
            </div>
          </aside>

          {/* Review list */}
          <div>
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-52" />)}</div>
            ) : reviews.length === 0 ? (
              <EmptyState icon={HiOutlineChatAlt2} title="No reviews to show" message={rating ? 'No reviews with this rating yet.' : 'Be the first to share your experience.'} />
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  {reviews.map((review, index) => (
                    <Reveal key={review.id} delay={index * 0.04}><ReviewCard review={review} /></Reveal>
                  ))}
                </div>
                <Pagination pagination={data.pagination} onPageChange={setPage} />
              </>
            )}
          </div>
        </div>
      </section>

      <ReviewModal appointment={reviewing} onClose={() => setReviewing(null)} onSubmitted={visits.refetch} />
    </>
  );
};

export default Reviews;
