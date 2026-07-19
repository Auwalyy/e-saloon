import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiSearch, HiEye, HiBan, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { customerService } from '../../services/index';
import { formatDate, formatCurrency, getInitials } from '../../utils/helpers';
import { TableSkeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = () => {
    setLoading(true);
    customerService.getAll({ page, limit: 15, search })
      .then(({ data }) => { setCustomers(data.data || []); setPagination(data.pagination || {}); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, search]);

  const viewCustomer = async (id) => {
    setDetailLoading(true);
    try {
      const { data } = await customerService.getOne(id);
      setSelected(data.data);
    } finally { setDetailLoading(false); }
  };

  const toggleStatus = async (id) => {
    try {
      const { data } = await customerService.toggleStatus(id);
      toast.success(`Customer ${data.data.is_active ? 'activated' : 'deactivated'}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total || 0} registered customers</p>
        </div>
      </div>

      <div className="card">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="input pl-10" placeholder="Search by name, email or phone..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {loading ? <TableSkeleton rows={10} cols={6} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Visits</th>
                <th>Total Spent</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No customers found</td></tr>
              ) : customers.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                        {c.avatar ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" /> :
                          <div className="w-full h-full bg-gold-500 flex items-center justify-center text-white text-sm font-bold">{getInitials(c.name)}</div>}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-gray-600">{c.phone || '—'}</td>
                  <td className="text-sm text-gray-600">{c.total_visits || 0}</td>
                  <td className="font-medium text-gold-600 text-sm">{formatCurrency(c.total_spent || 0)}</td>
                  <td className="text-sm text-gray-500">{formatDate(c.created_at)}</td>
                  <td><span className={`badge ${c.is_active ? 'badge-green' : 'badge-red'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => viewCustomer(c.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                        <HiEye className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleStatus(c.id)} className={`p-1.5 rounded-lg transition-colors ${c.is_active ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`}>
                        {c.is_active ? <HiBan className="w-4 h-4" /> : <HiCheckCircle className="w-4 h-4" />}
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

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Customer Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                {selected.avatar ? <img src={selected.avatar} alt={selected.name} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full bg-gold-500 flex items-center justify-center text-white text-2xl font-bold">{getInitials(selected.name)}</div>}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{selected.name}</h3>
                <p className="text-gray-500 text-sm">{selected.email}</p>
                <p className="text-gray-400 text-sm">{selected.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['Total Visits', selected.total_visits || 0], ['Total Spent', formatCurrency(selected.total_spent || 0)], ['Member Since', formatDate(selected.created_at)]].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-semibold text-gray-900 mt-1">{value}</p>
                </div>
              ))}
            </div>
            {selected.recent_appointments?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recent Appointments</h4>
                <div className="space-y-2">
                  {selected.recent_appointments.slice(0, 5).map(a => (
                    <div key={a.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                      <span className="text-gray-700">{a.service_name}</span>
                      <span className="text-gray-400">{formatDate(a.appointment_date)}</span>
                      <span className={`badge ${a.status === 'completed' ? 'badge-green' : 'badge-gold'}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCustomers;
