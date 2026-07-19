import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiCalendar, HiDownload, HiStar, HiX, HiRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { appointmentService, paymentService, reviewService } from '../../services/index';
import { formatDate, formatTime, formatCurrency, getStatusColor, downloadBlob } from '../../utils/helpers';
import { TableSkeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import StarRating from '../../components/ui/StarRating';
import Pagination from '../../components/ui/Pagination';

const MyBookings = () => {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    appointmentService.getAll({ page, limit: 10, status: statusFilter })
      .then(({ data }) => { setAppointments(data.data || []); setPagination(data.pagination || {}); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await appointmentService.update(cancelModal.id, { status: 'cancelled', cancellation_reason: 'Cancelled by customer' });
      toast.success('Appointment cancelled');
      setCancelModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async () => {
    setSubmitting(true);
    try {
      await reviewService.create({ appointment_id: reviewModal.id, rating, comment });
      toast.success('Review submitted! Thank you 🌟');
      setReviewModal(null);
      setRating(5); setComment('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const { data } = await paymentService.downloadReceipt(paymentId);
      downloadBlob(data, `receipt-${paymentId}.pdf`);
    } catch {
      toast.error('Receipt not available');
    }
  };

  const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <div className="min-h-screen bg-salon-bg py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-500 text-sm mt-1">View and manage your appointments</p>
          </div>
          <div className="flex gap-2">
            {statuses.map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-gold-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? <TableSkeleton rows={5} cols={6} /> : (
          <>
            {appointments.length === 0 ? (
              <div className="card text-center py-16">
                <HiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-500">No appointments found</h3>
                <p className="text-gray-400 text-sm mt-1">Book your first appointment today!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt, i) => (
                  <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center shrink-0">
                          <HiCalendar className="w-6 h-6 text-gold-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{appt.service_name}</h3>
                          <p className="text-sm text-gray-500">with {appt.stylist_name || 'TBD'}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {formatDate(appt.appointment_date)} at {formatTime(appt.start_time)}
                          </p>
                          <p className="text-gold-600 font-semibold text-sm mt-1">{formatCurrency(appt.total_amount)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={getStatusColor(appt.status)}>{appt.status}</span>
                        <span className={getStatusColor(appt.payment_status)}>{appt.payment_status}</span>
                        <div className="flex gap-2 flex-wrap justify-end">
                          {appt.status === 'completed' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setReviewModal(appt)}>
                                <HiStar className="w-4 h-4" /> Review
                              </Button>
                              {appt.payment_id && (
                                <Button variant="ghost" size="sm" onClick={() => handleDownloadReceipt(appt.payment_id)}>
                                  <HiDownload className="w-4 h-4" /> Receipt
                                </Button>
                              )}
                            </>
                          )}
                          {['pending', 'confirmed'].includes(appt.status) && (
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setCancelModal(appt)}>
                              <HiX className="w-4 h-4" /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            <Pagination {...pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Review Modal */}
      <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title="Leave a Review" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">How was your experience with <strong>{reviewModal?.service_name}</strong>?</p>
          <div>
            <label className="label">Rating</label>
            <StarRating rating={rating} interactive onChange={setRating} size="lg" />
          </div>
          <div>
            <label className="label">Comment</label>
            <textarea className="input resize-none" rows={4} placeholder="Share your experience..."
              value={comment} onChange={e => setComment(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setReviewModal(null)}>Cancel</Button>
            <Button onClick={handleReview} loading={submitting}>Submit Review</Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Appointment" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to cancel your <strong>{cancelModal?.service_name}</strong> appointment on <strong>{formatDate(cancelModal?.appointment_date)}</strong>?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setCancelModal(null)}>Keep Appointment</Button>
          <Button variant="danger" onClick={handleCancel} loading={submitting}>Yes, Cancel</Button>
        </div>
      </Modal>
    </div>
  );
};

export default MyBookings;
