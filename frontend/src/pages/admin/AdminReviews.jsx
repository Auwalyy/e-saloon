import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineChatAlt2, HiOutlineCheck, HiOutlineEyeOff, HiOutlineReply, HiOutlineStar, HiOutlineTrash } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { reviewService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { cleanParams, formatDate } from '../../utils/helpers';
import PageHeader from '../../components/admin/PageHeader';
import Avatar from '../../components/ui/Avatar';
import StarRating from '../../components/ui/StarRating';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

const FILTERS = [
  { value: 'pending', label: 'Awaiting approval' },
  { value: 'approved', label: 'Published' },
  { value: '', label: 'All reviews' },
];

/** Review moderation: approve, hide, reply to and delete customer reviews. */
const AdminReviews = () => {
  const [status, setStatus] = useState('pending');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [replying, setReplying] = useState(null);
  const [reply, setReply] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { data, loading, refetch } = useFetch(() => reviewService.getAll(cleanParams({ status, rating, page, limit: 8 })), [status, rating, page]);
  const reviews = data?.data || [];
  const summary = data?.summary;

  useEffect(() => { setPage(1); }, [status, rating]);

  const update = async (review, changes, successMessage) => {
    setBusyId(review.id);
    try {
      await reviewService.update(review.id, changes);
      toast.success(successMessage);
      refetch();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update the review'));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const saveReply = async () => {
    if (await update(replying, { reply }, reply ? 'Reply saved' : 'Reply removed')) setReplying(null);
  };

  const confirmDelete = async () => {
    setBusyId(deleting.id);
    try {
      await reviewService.remove(deleting.id);
      toast.success('Review deleted');
      setDeleting(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete the review'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Reviews appear on the website only after you approve them.">
        {summary && (
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm px-4 py-2">
            <HiOutlineStar className="w-5 h-5 text-gold-500" />
            <span className="font-semibold text-gray-900">{summary.average.toFixed(1)}</span>
            <span className="text-sm text-gray-500">from {summary.count} published</span>
          </div>
        )}
      </PageHeader>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="tablist">
          {FILTERS.map((filter) => (
            <button key={filter.label} type="button" role="tab" aria-selected={status === filter.value} onClick={() => setStatus(filter.value)} className={`tab ${status === filter.value ? 'tab-active' : 'bg-white shadow-sm'}`}>
              {filter.label}
            </button>
          ))}
        </div>
        <select className="input sm:w-44" value={rating} onChange={(event) => setRating(event.target.value)} aria-label="Filter by rating">
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((stars) => <option key={stars} value={stars}>{stars} star{stars > 1 ? 's' : ''}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="card">
          <EmptyState icon={HiOutlineChatAlt2} title={status === 'pending' ? 'No reviews waiting for approval' : 'No reviews found'} message={status === 'pending' ? 'You are all caught up.' : undefined} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="card flex flex-col">
                <div className="flex items-start gap-3">
                  <Avatar src={review.customer?.avatar} name={review.customer?.name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{review.customer?.name || 'Deleted customer'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {[review.service?.name, review.employee?.name && `with ${review.employee.name}`, formatDate(review.createdAt)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className={review.isApproved ? 'badge-green' : 'badge-gold'}>{review.isApproved ? 'Published' : 'Pending'}</span>
                </div>

                <div className="mt-3"><StarRating rating={review.rating} size="md" /></div>
                <p className="text-gray-600 mt-2 flex-1">{review.comment || <span className="italic text-gray-400">No written comment</span>}</p>

                {review.reply && (
                  <p className="mt-3 pl-3 border-l-2 border-gold-300 text-sm text-gray-600">
                    <span className="font-medium text-gray-800">Your reply:</span> {review.reply}
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                  {review.isApproved ? (
                    <Button size="sm" variant="outline" loading={busyId === review.id} onClick={() => update(review, { isApproved: false }, 'Review hidden from the website')}>
                      <HiOutlineEyeOff className="w-4 h-4" /> Hide
                    </Button>
                  ) : (
                    <Button size="sm" loading={busyId === review.id} onClick={() => update(review, { isApproved: true }, 'Review published')}>
                      <HiOutlineCheck className="w-4 h-4" /> Approve
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setReplying(review); setReply(review.reply || ''); }}>
                    <HiOutlineReply className="w-4 h-4" /> {review.reply ? 'Edit reply' : 'Reply'}
                  </Button>
                  <Button size="sm" variant="outline" className="!text-red-600" onClick={() => setDeleting(review)}>
                    <HiOutlineTrash className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={Boolean(replying)} onClose={() => setReplying(null)} title="Reply to review">
        {replying && (
          <div className="space-y-4">
            <div className="bg-salon-bg rounded-xl p-4">
              <StarRating rating={replying.rating} />
              <p className="text-sm text-gray-600 mt-2">{replying.comment || 'No written comment'}</p>
              <p className="text-xs text-gray-400 mt-2">{replying.customer?.name}</p>
            </div>
            <Textarea label="Your public reply" rows={4} maxLength={1000} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Thank the customer or respond to their feedback..." />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setReplying(null)}>Cancel</Button>
              <Button size="sm" loading={busyId === replying.id} onClick={saveReply}>Save Reply</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={Boolean(deleting) && busyId === deleting.id}
        title="Delete this review?"
        confirmLabel="Delete"
        message="The review will be permanently removed and the stylist's rating recalculated. To take it off the website without deleting it, use Hide instead."
      />
    </div>
  );
};

export default AdminReviews;
