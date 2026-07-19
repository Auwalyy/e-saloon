import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiCheck, HiTrash, HiSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { reviewService } from '../../services/index';
import { formatDate, getStatusColor } from '../../utils/helpers';
import StarRating from '../../components/ui/StarRating';
import { TableSkeleton } from '../../components/ui/Skeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [approved, setApproved] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    reviewService.getAll({ page, limit: 15, ...(approved !== '' ? { approved } : {}) })
      .then(({ data }) => { setReviews(data.data || []); setPagination(data.pagination || {}); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, approved]);

  const toggleApprove = async (id) => {
    try {
      await reviewService.approve(id);
      toast.success('Review status updated');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await reviewService.delete(deleteTarget.id);
      toast.success('Review deleted');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">Moderate customer reviews</p>
        </div>
        <div className="flex gap-2">
          {[['', 'All'], ['true', 'Approved'], ['false', 'Pending']].map(([val, label]) => (
            <button key={val} onClick={() => { setApproved(val); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${approved === val ? 'bg-gold-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <TableSkeleton rows={8} cols={6} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>Service</th><th>Rating</th><th>Comment</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No reviews found</td></tr>
              ) : reviews.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td className="font-medium text-gray-900 text-sm">{r.customer_name}</td>
                  <td className="text-sm text-gray-600">{r.service_name || '—'}</td>
                  <td><StarRating rating={r.rating} size="sm" /></td>
                  <td className="text-sm text-gray-600 max-w-xs truncate">{r.comment}</td>
                  <td className="text-sm text-gray-500">{formatDate(r.created_at)}</td>
                  <td><span className={`badge ${r.is_approved ? 'badge-green' : 'badge-gold'}`}>{r.is_approved ? 'Approved' : 'Pending'}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => toggleApprove(r.id)} className={`p-1.5 rounded-lg transition-colors ${r.is_approved ? 'hover:bg-gold-50 text-gold-600' : 'hover:bg-green-50 text-green-600'}`}>
                        <HiCheck className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(r)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="p-4"><Pagination {...pagination} onPageChange={setPage} /></div>
        </div>
      )}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Delete Review" message="Are you sure you want to delete this review?" />
    </div>
  );
};

export default AdminReviews;
