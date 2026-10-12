import { Link } from 'react-router-dom';
import {
  HiOutlineBan, HiOutlineCalendar, HiOutlineCash, HiOutlineCheckCircle, HiOutlineClock, HiOutlineCurrencyDollar,
  HiOutlineExclamation, HiOutlineTrendingUp, HiOutlineUserGroup, HiOutlineUsers,
} from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { dashboardService } from '../../services';
import { formatCurrency, formatDate, formatTime, getStatusColor, humanize } from '../../utils/helpers';
import PageHeader from '../../components/admin/PageHeader';
import {
  BookingStatusChart, BookingTrendChart, ChartCard, CustomerGrowthChart, RankingChart, RevenueChart,
} from '../../components/admin/Charts';
import StatsCard from '../../components/ui/StatsCard';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton, StatsSkeleton } from '../../components/ui/Skeleton';

/** Admin overview: revenue, bookings and customer numbers with charts. */
const Dashboard = () => {
  const { data, loading, error, refetch } = useFetch(() => dashboardService.get());

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <StatsSkeleton count={8} />
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div>
      </div>
    );
  }
  if (error) return <EmptyState title="Unable to load the dashboard" message={error} action={<Button onClick={refetch}>Try again</Button>} />;

  const { stats, charts, upcomingAppointments } = data.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="How the salon is doing right now.">
        <Link to="/admin/appointments" className="btn-primary !py-2 !px-4 !text-sm">Manage Appointments</Link>
      </PageHeader>

      {stats.lowStockCount > 0 && (
        <Link to="/admin/inventory" className="flex items-center gap-3 bg-gold-50 border border-gold-200 text-gold-900 rounded-2xl px-4 py-3 text-sm hover:bg-gold-100 transition-colors">
          <HiOutlineExclamation className="w-5 h-5 shrink-0" />
          <span><strong>{stats.lowStockCount}</strong> inventory item{stats.lowStockCount === 1 ? ' is' : 's are'} at or below the reorder level. Review stock</span>
        </Link>
      )}

      {/* Revenue */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Today's Revenue" value={formatCurrency(stats.todayRevenue)} icon={HiOutlineCash} color="gold" subtitle={`${stats.todayAppointments} appointment${stats.todayAppointments === 1 ? '' : 's'} today`} />
        <StatsCard title="Weekly Revenue" value={formatCurrency(stats.weekRevenue)} icon={HiOutlineTrendingUp} color="green" subtitle="Monday to today" delay={0.05} />
        <StatsCard title="Monthly Revenue" value={formatCurrency(stats.monthRevenue)} icon={HiOutlineCurrencyDollar} color="blue" change={stats.monthRevenueChange} changeLabel="vs same period last month" delay={0.1} />
        <StatsCard title="Outstanding Payments" value={formatCurrency(stats.outstandingPayments)} icon={HiOutlineClock} color="purple" subtitle="Booked but not yet paid" delay={0.15} />
      </div>

      {/* Volume */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard title="Customers" compact value={stats.totalCustomers} icon={HiOutlineUsers} color="blue" />
        <StatsCard title="Employees" compact value={stats.totalEmployees} icon={HiOutlineUserGroup} color="purple" delay={0.03} />
        <StatsCard title="Bookings" compact value={stats.totalBookings} icon={HiOutlineCalendar} color="gold" delay={0.06} />
        <StatsCard title="Pending" compact value={stats.pendingAppointments} icon={HiOutlineClock} color="gold" delay={0.09} />
        <StatsCard title="Completed" compact value={stats.completedAppointments} icon={HiOutlineCheckCircle} color="green" delay={0.12} />
        <StatsCard title="Cancelled" compact value={stats.cancelledAppointments} icon={HiOutlineBan} color="red" delay={0.15} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Revenue" subtitle="Payments received per day, last 30 days" className="lg:col-span-2">
          <RevenueChart data={charts.revenue} />
        </ChartCard>
        <ChartCard title="Booking Statistics" subtitle="All bookings by current status">
          <BookingStatusChart data={charts.bookingStatus} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Bookings per Month" subtitle="Completed versus cancelled, last 12 months">
          <BookingTrendChart data={charts.bookingTrend} />
        </ChartCard>
        <ChartCard title="Customer Growth" subtitle="Registered customers, last 12 months">
          <CustomerGrowthChart data={charts.customerGrowth} />
        </ChartCard>
        <ChartCard title="Popular Services" subtitle="Most booked services of all time">
          <RankingChart data={charts.popularServices} />
        </ChartCard>
      </div>

      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 font-sans">Upcoming Appointments</h2>
          <Link to="/admin/appointments" className="text-sm text-gold-700 font-medium hover:underline">View all</Link>
        </div>
        {upcomingAppointments.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No upcoming appointments.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcomingAppointments.map((appointment) => (
              <li key={appointment.id} className="py-3 flex items-center gap-4">
                <Avatar src={appointment.customer?.avatar} name={appointment.customer?.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{appointment.customer?.name}</p>
                  <p className="text-sm text-gray-500 truncate">{appointment.service?.name} with {appointment.employee?.name}</p>
                </div>
                <div className="text-right text-sm shrink-0">
                  <p className="font-medium text-gray-900">{formatDate(appointment.date, 'EEE, d MMM')}</p>
                  <p className="text-gray-500">{formatTime(appointment.startTime)}</p>
                </div>
                <span className={`${getStatusColor(appointment.status)} hidden sm:inline-flex`}>{humanize(appointment.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
