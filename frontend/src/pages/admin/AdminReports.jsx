import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiDownload, HiRefresh } from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { reportService } from '../../services/index';
import { formatCurrency, downloadBlob } from '../../utils/helpers';
import { Spinner } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

const AdminReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('monthly');
  const [exporting, setExporting] = useState('');

  const load = () => {
    setLoading(true);
    reportService.getReport({ type })
      .then(({ data }) => setReport(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [type]);

  const exportFile = async (format) => {
    setExporting(format);
    try {
      const fn = format === 'pdf' ? reportService.exportPDF : reportService.exportExcel;
      const { data } = await fn({ type });
      downloadBlob(data, `${type}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      toast.success(`${format.toUpperCase()} exported!`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  const totalRevenue = report?.revenue?.reduce((s, r) => s + parseFloat(r.total), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Business analytics and reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportFile('pdf')} loading={exporting === 'pdf'}>
            <HiDownload className="w-4 h-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportFile('excel')} loading={exporting === 'excel'}>
            <HiDownload className="w-4 h-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {['daily', 'weekly', 'monthly', 'annual'].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${type === t ? 'bg-gold-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
        <button onClick={load} className="p-2 hover:bg-gray-100 rounded-xl transition-colors ml-auto">
          <HiRefresh className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Total Revenue', formatCurrency(totalRevenue), 'gold'],
              ['Total Transactions', report?.revenue?.reduce((s, r) => s + parseInt(r.count), 0) || 0, 'blue'],
              ['Appointments', report?.appointments?.reduce((s, a) => s + parseInt(a.count), 0) || 0, 'green'],
              ['Top Service', report?.top_services?.[0]?.name || '—', 'purple'],
            ].map(([label, value, color]) => (
              <div key={label} className="card">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className={`text-xl font-bold mt-1 ${color === 'gold' ? 'text-gold-600' : color === 'green' ? 'text-green-600' : color === 'blue' ? 'text-blue-600' : 'text-purple-600'}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Revenue by Day</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={report?.revenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="total" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Services */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Top Services</h3>
              <div className="space-y-3">
                {(report?.top_services || []).map((svc, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <span className="text-sm text-gray-700">{svc.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gold-600">{formatCurrency(svc.revenue)}</p>
                      <p className="text-xs text-gray-400">{svc.bookings} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Customers */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Top Customers</h3>
              <div className="space-y-3">
                {(report?.top_customers || []).map((cust, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-sm text-gray-700">{cust.name}</p>
                        <p className="text-xs text-gray-400">{cust.visits} visits</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gold-600">{formatCurrency(cust.spent)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Appointment Status */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Appointment Breakdown</h3>
            <div className="flex flex-wrap gap-4">
              {(report?.appointments || []).map(a => (
                <div key={a.status} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                  <span className={`badge ${a.status === 'completed' ? 'badge-green' : a.status === 'cancelled' ? 'badge-red' : 'badge-gold'}`}>{a.status}</span>
                  <span className="font-bold text-gray-900">{a.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
