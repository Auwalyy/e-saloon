import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineCash, HiOutlineClock, HiOutlineCreditCard, HiOutlineDocumentText, HiOutlineReceiptRefund, HiOutlineReceiptTax, HiOutlineRefresh } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import useDocuments from '../../hooks/useDocuments';
import { paymentService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { cleanParams, formatCurrency, formatDateTime, getStatusColor, humanize, PAYMENT_METHODS } from '../../utils/helpers';
import PageHeader from '../../components/admin/PageHeader';
import StatsCard from '../../components/ui/StatsCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

const STATUSES = ['pending', 'success', 'failed', 'refunded', 'cancelled'];
const SALON_METHODS = ['cash', 'pos', 'bank_transfer'];
const statusLabel = (status) => (status === 'success' ? 'Paid' : humanize(status));

/** Records a payment taken at the salon. */
const RecordPaymentModal = ({ payment, onClose, onDone }) => {
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!payment) return;
    setMethod(SALON_METHODS.includes(payment.method) ? payment.method : 'cash');
    setNote('');
  }, [payment]);

  const save = async () => {
    setSaving(true);
    try {
      await paymentService.markPaid(payment.id, { method, note: note || undefined });
      toast.success('Payment recorded. A receipt has been emailed to the customer.');
      onDone();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to record the payment'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={Boolean(payment)} onClose={onClose} title="Record payment" size="sm">
      {payment && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Confirm that <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span> has been received from{' '}
            <span className="font-semibold text-gray-900">{payment.customer?.name}</span> for {payment.appointment?.service?.name}.
          </p>
          <div>
            <label className="label" htmlFor="payment-method">Paid by</label>
            <select id="payment-method" className="input" value={method} onChange={(event) => setMethod(event.target.value)}>
              {SALON_METHODS.map((item) => <option key={item} value={item}>{PAYMENT_METHODS[item]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="payment-note">Note (optional)</label>
            <input id="payment-note" className="input" maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. transfer reference" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={save} loading={saving}>Confirm Payment</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

/** Payment management: every payment with search, filters, invoices, receipts and refunds. */
const AdminPayments = () => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', method: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [recording, setRecording] = useState(null);
  const [refunding, setRefunding] = useState(null);
  const [working, setWorking] = useState(false);
  const debouncedSearch = useDebounce(search);
  const documents = useDocuments();

  const { data, loading, refetch } = useFetch(
    () => paymentService.getAll(cleanParams({ ...filters, search: debouncedSearch, page, limit: 10 })),
    [filters, debouncedSearch, page]
  );
  const payments = data?.data || [];
  const summary = data?.summary;

  useEffect(() => { setPage(1); }, [filters, debouncedSearch]);

  const setFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const hasFilters = search || Object.values(filters).some(Boolean);

  const confirmRefund = async () => {
    setWorking(true);
    try {
      await paymentService.refund(refunding.id, {});
      toast.success('Payment marked as refunded');
      setRefunding(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to refund the payment'));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <PageHeader title="Payments" subtitle="Track what has been paid, what is owed, and issue documents." />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <StatsCard title="Total Collected" value={formatCurrency(summary.collected)} icon={HiOutlineCash} color="green" />
          <StatsCard title="Outstanding" value={formatCurrency(summary.outstanding)} icon={HiOutlineClock} color="gold" subtitle={`${summary.pendingCount} unpaid booking${summary.pendingCount === 1 ? '' : 's'}`} delay={0.05} />
          <StatsCard title="Refunded" value={formatCurrency(summary.refunded)} icon={HiOutlineReceiptRefund} color="gray" delay={0.1} />
        </div>
      )}

      <div className="card !p-4 mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto_auto_auto]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search payment ID, receipt no. or customer..." />
        <select className="input" value={filters.status} onChange={(event) => setFilter('status', event.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
        </select>
        <select className="input" value={filters.method} onChange={(event) => setFilter('method', event.target.value)} aria-label="Filter by method">
          <option value="">All methods</option>
          {Object.entries(PAYMENT_METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input type="date" className="input" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} aria-label="From date" title="From date" />
        <input type="date" className="input" value={filters.to} min={filters.from} onChange={(event) => setFilter('to', event.target.value)} aria-label="To date" title="To date" />
        <Button variant="outline" disabled={!hasFilters} onClick={() => { setSearch(''); setFilters({ status: '', method: '', from: '', to: '' }); }}>
          <HiOutlineRefresh className="w-4 h-4" /> Reset
        </Button>
      </div>

      {loading ? (
        <TableSkeleton cols={7} rows={8} />
      ) : payments.length === 0 ? (
        <div className="card"><EmptyState icon={HiOutlineCreditCard} title="No payments found" message={hasFilters ? 'Try changing or resetting the filters.' : 'Payments are created automatically with each booking.'} /></div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Payment ID</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <p className="font-mono text-xs text-gray-900">{payment.reference}</p>
                      {payment.receiptNumber && <p className="font-mono text-[11px] text-gray-400">{payment.receiptNumber}</p>}
                    </td>
                    <td>
                      <p className="font-medium text-gray-900">{payment.customer?.name || 'Deleted customer'}</p>
                      <p className="text-xs text-gray-500">{payment.appointment?.service?.name}</p>
                    </td>
                    <td className="font-semibold">{formatCurrency(payment.amount)}</td>
                    <td>{PAYMENT_METHODS[payment.method]}</td>
                    <td><span className={getStatusColor(payment.status)}>{statusLabel(payment.status)}</span></td>
                    <td className="whitespace-nowrap">{formatDateTime(payment.paidAt || payment.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-0.5">
                        {['pending', 'failed'].includes(payment.status) && (
                          <Button size="sm" onClick={() => setRecording(payment)}>Record</Button>
                        )}
                        <button type="button" className="icon-btn" title="Download invoice" aria-label="Download invoice" disabled={documents.busyId === payment.id} onClick={() => documents.downloadInvoice(payment)}>
                          <HiOutlineDocumentText className="w-5 h-5" />
                        </button>
                        {payment.receiptNumber && (
                          <button type="button" className="icon-btn text-green-600" title="Download receipt" aria-label="Download receipt" disabled={documents.busyId === payment.id} onClick={() => documents.downloadReceipt(payment)}>
                            <HiOutlineReceiptTax className="w-5 h-5" />
                          </button>
                        )}
                        {payment.status === 'success' && (
                          <button type="button" className="icon-btn text-red-500" title="Mark as refunded" aria-label="Mark as refunded" onClick={() => setRefunding(payment)}>
                            <HiOutlineReceiptRefund className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}

      <RecordPaymentModal payment={recording} onClose={() => setRecording(null)} onDone={refetch} />
      <ConfirmDialog
        isOpen={Boolean(refunding)}
        onClose={() => setRefunding(null)}
        onConfirm={confirmRefund}
        loading={working}
        title="Mark this payment as refunded?"
        confirmLabel="Mark refunded"
        message={refunding ? `${formatCurrency(refunding.amount)} from ${refunding.customer?.name} will be recorded as refunded and removed from revenue. Return the money to the customer separately; this does not move any funds.` : ''}
      />
    </div>
  );
};

export default AdminPayments;
