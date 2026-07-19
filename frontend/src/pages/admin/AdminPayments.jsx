import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiSearch, HiDownload } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/index';
import { formatDate, formatCurrency, getStatusColor, downloadBlob } from '../../utils/helpers';
import { TableSkeleton } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');

  useEffect(() => {
    setLoading(true);
    paymentService.getAll({ page, limit: 15, search, status, method })
      .then(({ data }) => { setPayments(data.data || []); setPagination(data.pagination || {}); })
      .finally(() => setLoading(false));
  }, [page, search, status, method]);

  const downloadReceipt = async (id, ref) => {
    try {
      const { data } = await paymentService.downloadReceipt(id);
      downloadBlob(data, `receipt-${ref}.pdf`);
    } catch { toast.error('Receipt not available'); }
  };

  const totalRevenue = payments.filter(p => p.status === 'success').reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 text-sm mt-1">Total shown: {formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input className="input pl-10" placeholder="Search by customer or reference..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input sm:w-40" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {['pending', 'success', 'failed', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input sm:w-40" value={method} onChange={e => { setMethod(e.target.value); setPage(1); }}>
            <option value="">All Methods</option>
            {['paystack', 'flutterwave', 'cash', 'card'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? <TableSkeleton rows={10} cols={7} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No payments found</td></tr>
              ) : payments.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td className="font-mono text-xs text-gray-600">{p.reference?.slice(0, 16)}...</td>
                  <td>
                    <p className="text-sm font-medium text-gray-900">{p.customer_name}</p>
                    <p className="text-xs text-gray-400">{p.customer_email}</p>
                  </td>
                  <td className="text-sm text-gray-600">{p.service_name || '—'}</td>
                  <td className="font-semibold text-gold-600">{formatCurrency(p.amount)}</td>
                  <td><span className="badge badge-blue capitalize">{p.method}</span></td>
                  <td><span className={getStatusColor(p.status)}>{p.status}</span></td>
                  <td className="text-sm text-gray-500">{formatDate(p.created_at)}</td>
                  <td>
                    {p.status === 'success' && (
                      <button onClick={() => downloadReceipt(p.id, p.reference)} className="p-1.5 hover:bg-gold-50 rounded-lg text-gold-600 transition-colors">
                        <HiDownload className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="p-4"><Pagination {...pagination} onPageChange={setPage} /></div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
