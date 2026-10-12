import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlineBan, HiOutlineCheckCircle, HiOutlineEye, HiOutlinePlus, HiOutlineTrash, HiOutlineUsers } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { customerService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { cleanParams, formatCurrency, formatDate, formatTime, getStatusColor, humanize, PAYMENT_METHODS } from '../../utils/helpers';
import { rules, applyServerErrors } from '../../utils/validation';
import PageHeader from '../../components/admin/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton, TableSkeleton } from '../../components/ui/Skeleton';

/* ------------------------------ Customer detail ----------------------------- */

const CustomerDetail = ({ customerId, onClose }) => {
  const [tab, setTab] = useState('bookings');
  const { data, loading } = useFetch(
    () => (customerId ? customerService.getOne(customerId) : Promise.resolve(null)),
    [customerId]
  );
  const detail = data?.data;

  useEffect(() => { setTab('bookings'); }, [customerId]);

  return (
    <Modal isOpen={Boolean(customerId)} onClose={onClose} title="Customer profile" size="xl">
      {loading || !detail ? (
        <div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-64" /></div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={detail.customer.avatar} name={detail.customer.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-gray-900">{detail.customer.name}</p>
              <p className="text-sm text-gray-500 truncate">{detail.customer.email} · {detail.customer.phone || 'No phone'}</p>
              <p className="text-xs text-gray-400">Joined {formatDate(detail.customer.createdAt)}</p>
            </div>
            <span className={detail.customer.isActive ? 'badge-green' : 'badge-red'}>{detail.customer.isActive ? 'Active' : 'Deactivated'}</span>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Total bookings', detail.stats.totalBookings],
              ['Completed', detail.stats.completed],
              ['Cancelled / no-show', detail.stats.cancelled + detail.stats.noShow],
              ['Total spent', formatCurrency(detail.stats.totalSpent)],
            ].map(([label, value]) => (
              <div key={label} className="bg-salon-bg rounded-xl p-3 text-center">
                <dd className="text-lg font-bold text-gray-900">{value}</dd>
                <dt className="text-xs text-gray-500">{label}</dt>
              </div>
            ))}
          </dl>

          <div className="flex gap-2" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'bookings'} onClick={() => setTab('bookings')} className={`tab ${tab === 'bookings' ? 'tab-active' : 'bg-gray-100'}`}>Booking history</button>
            <button type="button" role="tab" aria-selected={tab === 'spending'} onClick={() => setTab('spending')} className={`tab ${tab === 'spending' ? 'tab-active' : 'bg-gray-100'}`}>Spending history</button>
          </div>

          {tab === 'bookings' && (
            detail.appointments.length === 0 ? <p className="text-sm text-gray-500 py-4">No bookings yet.</p> : (
              <div className="table-container !shadow-none border border-gray-100">
                <table className="table">
                  <thead><tr><th>Date</th><th>Service</th><th>Stylist</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {detail.appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="whitespace-nowrap">{formatDate(appointment.date)} · {formatTime(appointment.startTime)}</td>
                        <td>{appointment.service?.name}</td>
                        <td>{appointment.employee?.name}</td>
                        <td>{formatCurrency(appointment.price)}</td>
                        <td><span className={getStatusColor(appointment.status)}>{humanize(appointment.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'spending' && (
            detail.payments.length === 0 ? <p className="text-sm text-gray-500 py-4">No payments yet.</p> : (
              <div className="table-container !shadow-none border border-gray-100">
                <table className="table">
                  <thead><tr><th>Payment ID</th><th>Service</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {detail.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="font-mono text-xs">{payment.reference}</td>
                        <td>{payment.appointment?.service?.name || '-'}</td>
                        <td>{PAYMENT_METHODS[payment.method]}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td><span className={getStatusColor(payment.status)}>{payment.status === 'success' ? 'Paid' : humanize(payment.status)}</span></td>
                        <td className="whitespace-nowrap">{formatDate(payment.paidAt || payment.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </Modal>
  );
};

/* ------------------------------- Add customer ------------------------------- */

const AddCustomerModal = ({ isOpen, onClose, onSaved }) => {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => { if (isOpen) reset({ name: '', email: '', phone: '', address: '' }); }, [isOpen, reset]);

  const onSubmit = async (values) => {
    try {
      await customerService.create(values);
      toast.success('Customer added. They can set a password using "Forgot password".');
      onSaved();
      onClose();
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error, 'Unable to add the customer'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add customer">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Full name" error={errors.name?.message} {...register('name', rules.name)} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email', rules.email)} />
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone', rules.optionalPhone)} />
        <Input label="Address (optional)" error={errors.address?.message} {...register('address')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={isSubmitting}>Add Customer</Button>
        </div>
      </form>
    </Modal>
  );
};

/* ----------------------------------- Page ----------------------------------- */

/** Customer management: search, view history and spending, deactivate or delete. */
const AdminCustomers = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(null); // { type: 'toggle' | 'delete', customer }
  const [working, setWorking] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, loading, refetch } = useFetch(
    () => customerService.getAll(cleanParams({ search: debouncedSearch, status, page, limit: 10 })),
    [debouncedSearch, status, page]
  );
  const customers = data?.data || [];

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const runConfirmed = async () => {
    const { type, customer } = confirming;
    setWorking(true);
    try {
      const { message } = type === 'delete' ? await customerService.remove(customer.id) : await customerService.toggleStatus(customer.id);
      toast.success(message);
      setConfirming(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update the customer'));
    } finally {
      setWorking(false);
    }
  };

  const isDeactivating = confirming?.type === 'toggle' && confirming.customer.isActive;

  return (
    <div>
      <PageHeader title="Customers" subtitle={data ? `${data.pagination.total} customer${data.pagination.total === 1 ? '' : 's'}` : undefined}>
        <Button size="sm" onClick={() => setAdding(true)}><HiOutlinePlus className="w-4 h-4" /> Add Customer</Button>
      </PageHeader>

      <div className="card !p-4 mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email or phone..." />
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">All customers</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton cols={6} rows={8} />
      ) : customers.length === 0 ? (
        <div className="card"><EmptyState icon={HiOutlineUsers} title="No customers found" message="Try a different search term or filter." /></div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Customer</th><th>Phone</th><th>Joined</th><th>Bookings</th><th>Total spent</th><th>Status</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar src={customer.avatar} name={customer.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">{customer.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[180px]">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{customer.phone || '-'}</td>
                    <td className="whitespace-nowrap">{formatDate(customer.createdAt)}</td>
                    <td>{customer.totalBookings}</td>
                    <td className="font-medium">{formatCurrency(customer.totalSpent)}</td>
                    <td><span className={customer.isActive ? 'badge-green' : 'badge-red'}>{customer.isActive ? 'Active' : 'Deactivated'}</span></td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <button type="button" className="icon-btn" title="View history" aria-label="View history" onClick={() => setViewingId(customer.id)}>
                          <HiOutlineEye className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          className={`icon-btn ${customer.isActive ? 'text-red-500' : 'text-green-600'}`}
                          title={customer.isActive ? 'Deactivate' : 'Reactivate'}
                          aria-label={customer.isActive ? 'Deactivate' : 'Reactivate'}
                          onClick={() => setConfirming({ type: 'toggle', customer })}
                        >
                          {customer.isActive ? <HiOutlineBan className="w-5 h-5" /> : <HiOutlineCheckCircle className="w-5 h-5" />}
                        </button>
                        <button type="button" className="icon-btn text-red-500" title="Delete" aria-label="Delete" onClick={() => setConfirming({ type: 'delete', customer })}>
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
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

      <CustomerDetail customerId={viewingId} onClose={() => setViewingId(null)} />
      <AddCustomerModal isOpen={adding} onClose={() => setAdding(false)} onSaved={refetch} />
      <ConfirmDialog
        isOpen={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={runConfirmed}
        loading={working}
        variant={confirming?.type === 'toggle' && !isDeactivating ? 'primary' : 'danger'}
        title={confirming?.type === 'delete' ? 'Delete this customer?' : isDeactivating ? 'Deactivate this customer?' : 'Reactivate this customer?'}
        confirmLabel={confirming?.type === 'delete' ? 'Delete' : isDeactivating ? 'Deactivate' : 'Reactivate'}
        message={
          confirming?.type === 'delete'
            ? `${confirming.customer.name}'s account will be permanently removed. Customers with booking history cannot be deleted, only deactivated.`
            : isDeactivating
              ? `${confirming?.customer.name} will no longer be able to sign in or book appointments.`
              : `${confirming?.customer.name} will be able to sign in and book again.`
        }
      />
    </div>
  );
};

export default AdminCustomers;
