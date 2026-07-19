import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  HiCurrencyDollar, HiUsers, HiCalendar, HiCheckCircle,
  HiXCircle, HiClock, HiUserGroup, HiTrendingUp,
} from 'react-icons/hi';
import { dashboardService } from '../../services/index';
import { formatCurrency, formatDate } from '../../utils/helpers';
import StatsCard from '../../components/ui/StatsCard';
import { Skeleton } from '../../components/ui/Skeleton';

const COLORS = ['#D4AF37', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardService.getStats(), dashboardService.getActivity()])
      .then(([s, a]) => { setStats(s.data.data); setActivity(a.data.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );

  const s = stats?.stats || {};
  const charts = stats?.charts || {};

  const statCards = [
    { title: "Today's Revenue", value: formatCurrency(s.today_revenue), icon: HiCurrencyDollar, color: 'gold' },
    { title: 'Monthly Revenue', value: formatCurrency(s.month_revenue), icon: HiTrendingUp, color: 'green' },
    { title: 'Total Customers', value: s.total_customers?.toLocaleString(), icon: HiUsers, color: 'blue' },
    { title: 'Total Employees', value: s.total_employees, icon: HiUserGroup, color: 'purple' },
    { title: 'Total Bookings', value: s.total_bookings?.toLocaleString(), icon: HiCalendar, color: 'gold' },
    { title: 'Pending', value: s.pending_appointments, icon: HiClock, color: 'gold' },
    { title: 'Completed', value: s.completed_appointments, icon: HiCheckCircle, color: 'green' },
    { title: 'Cancelled', value: s.cancelled_appointments, icon: HiXCircle, color: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={charts.revenue || []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => formatDate(d, 'MMM dd')} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatCurrency(v)} labelFormatter={d => formatDate(d)} />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Pie */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Booking Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={charts.bookings || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                {(charts.bookings || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Popular Services</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.popular_services || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#D4AF37" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Growth */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Customer Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.customer_growth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Appointments</h3>
          <div className="space-y-3">
            {(activity?.appointments || []).slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.customer_name}</p>
                  <p className="text-xs text-gray-400">{a.service_name} · {formatDate(a.appointment_date)}</p>
                </div>
                <span className={`badge ${a.status === 'completed' ? 'badge-green' : a.status === 'cancelled' ? 'badge-red' : 'badge-gold'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {(activity?.payments || []).slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.customer_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.method} · {formatDate(p.created_at)}</p>
                </div>
                <span className="font-semibold text-gold-600 text-sm">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
