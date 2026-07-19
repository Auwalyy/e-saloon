import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiSearch, HiFilter, HiEye, HiCheck, HiX, HiRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services/index';
import { formatDate, formatTime, formatCurrency, getStatusColor } from '../../utils/helpers';
import { TableSkeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';

const STATUSES = ['', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    appointmentService.getAll({ page, limit: 15, search, status })
      .then(({ data }) => { setAppointments(data.data || []); setPagination(data.pagination || {}); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, search, status]);

  const updateStatus = async (id, newStatus) => {
    setUpdating(true);
    try {
      await appointmentService.update(id, { status: newStatus });
      toast.success(`Appointment ${newStatus}`);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all salon appointments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input className="input pl-10" placeholder="Search by customer or service..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input sm:w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>
      </div>

      {loading ? <TableSkeleton rows={10} cols={7} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Stylist</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No appointments found</td></tr>
              ) : appointments.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td>
                    <div>
                      <p className="font-medium text-gray-900">{a.customer_name}</p>
                      <p className="text-xs text-gray-400">{a.customer_email}</p>
                    </div>
                  </td>
                  <td className="text-sm text-gray-700">{a.service_name}</td>
                  <td className="text-sm text-gray-700">{a.stylist_name || '—'}</td>
                  <td>
                    <p className="text-sm text-gray-700">{formatDate(a.appointment_date)}</p>
                    <p className="text-xs text-gray-400">{formatTime(a.start_time)}</p>
                  </td>
                  <td className="font-medium text-gold-600">{formatCurrency(a.total_amount)}</td>
                  <td><span className={getStatusColor(a.status)}>{a.status}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(a)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="View">
                        <HiEye className="w-4 h-4" />
                      </button>
                      {a.status === 'pending' && (
                        <button onClick={() => updateStatus(a.id, 'confirmed')} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors" title="Confirm">
                          <HiCheck className="w-4 h-4" />
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(a.status) && (
                        <button onClick={() => updateStatus(a.id, 'cancelled')} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Cancel">
                          <HiX className="w-4 h-4" />
                        </button>
                      )}
                      {a.status === 'confirmed' && (
                        <button onClick={() => updateStatus(a.id, 'completed')} className="p-1.5 hover:bg-gold-50 rounded-lg text-gold-600 transition-colors" title="Complete">
                          <HiRefresh className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="p-4">
            <Pagination {...pagination} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Appointment Details">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Customer', selected.customer_name],
                ['Email', selected.customer_email],
                ['Phone', selected.customer_phone],
                ['Service', selected.service_name],
                ['Stylist', selected.stylist_name || 'TBD'],
                ['Date', formatDate(selected.appointment_date)],
                ['Time', formatTime(selected.start_time)],
                ['Duration', `${selected.service_duration} min`],
                ['Amount', formatCurrency(selected.total_amount)],
                ['Payment', selected.payment_status],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</p>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div className="bg-gold-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Notes</p>
                <p className="text-sm text-gray-700 mt-0.5">{selected.notes}</p>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {selected.status === 'pending' && (
                <Button size="sm" onClick={() => updateStatus(selected.id, 'confirmed')} loading={updating}>Confirm</Button>
              )}
              {selected.status === 'confirmed' && (
                <Button size="sm" onClick={() => updateStatus(selected.id, 'completed')} loading={updating}>Mark Completed</Button>
              )}
              {['pending', 'confirmed'].includes(selected.status) && (
                <Button size="sm" variant="danger" onClick={() => updateStatus(selected.id, 'cancelled')} loading={updating}>Cancel</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAppointments;
