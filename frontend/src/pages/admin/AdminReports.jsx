import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineBan, HiOutlineCalendar, HiOutlineCash, HiOutlineCheckCircle, HiOutlineDocumentDownload, HiOutlineShoppingBag,
  HiOutlineTable, HiOutlineUserAdd,
} from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { reportService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { downloadBlob, formatCurrency, formatDate, PAYMENT_METHODS, toDateString } from '../../utils/helpers';
import PageHeader from '../../components/admin/PageHeader';
import { ChartCard, CHART_COLORS, RankingChart, RevenueChart } from '../../components/admin/Charts';
import StatsCard from '../../components/ui/StatsCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton, StatsSkeleton } from '../../components/ui/Skeleton';

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
];

/** Business reports for a day, week, month or year, exportable to PDF and Excel. */
const AdminReports = () => {
  const [period, setPeriod] = useState('monthly');
  const [date, setDate] = useState(() => toDateString());
  const [exporting, setExporting] = useState('');

  const { data, loading, error, refetch } = useFetch(() => reportService.get({ period, date }), [period, date]);
  const report = data?.data;

  const exportReport = async (format) => {
    setExporting(format);
    try {
      const blob = await (format === 'pdf' ? reportService.exportPdf({ period, date }) : reportService.exportExcel({ period, date }));
      downloadBlob(blob, `${period}-report-${report?.range.fromDate || date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      toast.success(`${format === 'pdf' ? 'PDF' : 'Excel'} report downloaded`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to export the report'));
    } finally {
      setExporting('');
    }
  };

  const rangeLabel = report && (report.range.fromDate === report.range.toDate
    ? formatDate(report.range.fromDate, 'EEEE, d MMMM yyyy')
    : `${formatDate(report.range.fromDate)} to ${formatDate(report.range.toDate)}`);

  return (
    <div>
      <PageHeader title="Reports" subtitle={rangeLabel || 'Revenue, bookings and performance for any period.'}>
        <Button size="sm" variant="outline" loading={exporting === 'pdf'} disabled={!report || Boolean(exporting)} onClick={() => exportReport('pdf')}>
          <HiOutlineDocumentDownload className="w-4 h-4" /> Export PDF
        </Button>
        <Button size="sm" variant="outline" loading={exporting === 'excel'} disabled={!report || Boolean(exporting)} onClick={() => exportReport('excel')}>
          <HiOutlineTable className="w-4 h-4" /> Export Excel
        </Button>
      </PageHeader>

      <div className="card !p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Report period">
          {PERIODS.map((option) => (
            <button key={option.value} type="button" role="tab" aria-selected={period === option.value} onClick={() => setPeriod(option.value)} className={`tab ${period === option.value ? 'tab-active' : 'bg-gray-100'}`}>
              {option.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Any date in the period
          <input type="date" className="input !w-44 !py-2" value={date} max={toDateString()} onChange={(event) => event.target.value && setDate(event.target.value)} />
        </label>
      </div>

      {loading && (
        <div className="space-y-6">
          <StatsSkeleton count={8} />
          <Skeleton className="h-80" />
        </div>
      )}
      {!loading && error && <div className="card"><EmptyState title="Unable to load the report" message={error} action={<Button size="sm" onClick={refetch}>Try again</Button>} /></div>}

      {!loading && report && (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
            <StatsCard title="Revenue" value={formatCurrency(report.summary.revenue)} icon={HiOutlineCash} color="green" subtitle={`${report.summary.paymentsCount} payment${report.summary.paymentsCount === 1 ? '' : 's'}`} />
            <StatsCard title="Average Payment" value={formatCurrency(Math.round(report.summary.averagePayment))} icon={HiOutlineCash} color="gold" delay={0.03} />
            <StatsCard title="Bookings" value={report.summary.bookings} icon={HiOutlineCalendar} color="blue" subtitle={`${report.summary.pending + report.summary.confirmed} still open`} delay={0.06} />
            <StatsCard title="Completed" value={report.summary.completed} icon={HiOutlineCheckCircle} color="green" delay={0.09} />
            <StatsCard title="Cancelled / Rejected" value={report.summary.cancelled + report.summary.rejected} icon={HiOutlineBan} color="red" subtitle={`${report.summary.noShow} no-show${report.summary.noShow === 1 ? '' : 's'}`} delay={0.12} />
            <StatsCard title="New Customers" value={report.summary.newCustomers} icon={HiOutlineUserAdd} color="purple" delay={0.15} />
            <StatsCard title="Retail Sales" value={formatCurrency(report.summary.productSales)} icon={HiOutlineShoppingBag} color="gold" delay={0.18} />
            <StatsCard title="Stock Purchases" value={formatCurrency(report.summary.stockPurchases)} icon={HiOutlineShoppingBag} color="gray" delay={0.21} />
          </div>

          {period !== 'daily' && (
            <ChartCard title="Revenue" subtitle={period === 'annual' ? 'Payments received per month' : 'Payments received per day'}>
              <RevenueChart data={report.revenueSeries} xKey={period === 'annual' ? 'label' : 'key'} dateAxis={period !== 'annual'} />
            </ChartCard>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Top Services" subtitle="By number of bookings in this period">
              <RankingChart data={report.topServices.slice(0, 8)} height={Math.max(160, Math.min(8, report.topServices.length) * 36)} />
            </ChartCard>
            <ChartCard title="Stylist Performance" subtitle="Value of bookings handled in this period">
              <RankingChart data={report.topStylists} dataKey="value" name="Booking value" color={CHART_COLORS.blue} valueFormatter={(value) => formatCurrency(value, { compact: true })} height={Math.max(160, report.topStylists.length * 36)} />
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <h2 className="font-semibold text-gray-900 font-sans mb-3">Payments by Method</h2>
              {report.paymentMethods.length === 0 ? <p className="text-sm text-gray-400 py-6 text-center">No payments in this period</p> : (
                <table className="table">
                  <thead><tr><th>Method</th><th className="text-right">Payments</th><th className="text-right">Amount</th></tr></thead>
                  <tbody>
                    {report.paymentMethods.map((row) => (
                      <tr key={row.method}>
                        <td>{PAYMENT_METHODS[row.method]}</td>
                        <td className="text-right">{row.count}</td>
                        <td className="text-right font-medium">{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="card">
              <h2 className="font-semibold text-gray-900 font-sans mb-3">Service Breakdown</h2>
              {report.topServices.length === 0 ? <p className="text-sm text-gray-400 py-6 text-center">No bookings in this period</p> : (
                <div className="max-h-72 overflow-y-auto">
                  <table className="table">
                    <thead><tr><th>Service</th><th className="text-right">Bookings</th><th className="text-right">Value</th></tr></thead>
                    <tbody>
                      {report.topServices.map((row) => (
                        <tr key={row.id}>
                          <td>{row.name}</td>
                          <td className="text-right">{row.bookings}</td>
                          <td className="text-right font-medium">{formatCurrency(row.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <p className="text-xs text-gray-400">
            Revenue counts payments received in the period. Bookings are counted by appointment date, and booking values include
            appointments that are still open.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
