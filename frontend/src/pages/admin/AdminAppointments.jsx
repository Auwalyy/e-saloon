import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineBan, HiOutlineCalendar, HiOutlineCheck, HiOutlineCheckCircle, HiOutlineEye, HiOutlinePlus,
  HiOutlineRefresh, HiOutlineTrash, HiOutlineUserRemove, HiOutlineX,
} from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { appointmentService, customerService, employeeService, serviceService } from '../../services';
import { getErrorMessage } from '../../services/api';
import {
  cleanParams, formatCurrency, formatDate, formatDateTime, formatDuration, formatTime, getStatusColor, humanize, PAYMENT_METHODS,
} from '../../utils/helpers';
import PageHeader from '../../components/admin/PageHeader';
import RescheduleModal from '../../components/common/RescheduleModal';
import DateSlotPicker from '../../components/common/DateSlotPicker';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Textarea from '../../components/ui/Textarea';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'no_show'];

// What each status change is called, and whether it needs a reason.
const ACTIONS = {
  confirmed: { label: 'Approve', title: 'Approve this appointment?', confirm: 'Approve', variant: 'primary', icon: HiOutlineCheck, tone: 'text-green-600' },
  rejected: { label: 'Reject', title: 'Reject this appointment?', confirm: 'Reject', variant: 'danger', icon: HiOutlineX, tone: 'text-red-600', needsReason: true },
  cancelled: { label: 'Cancel', title: 'Cancel this appointment?', confirm: 'Cancel appointment', variant: 'danger', icon: HiOutlineBan, tone: 'text-red-600', needsReason: true },
  completed: { label: 'Mark completed', title: 'Mark as completed?', confirm: 'Mark completed', variant: 'primary', icon: HiOutlineCheckCircle, tone: 'text-green-600' },
  no_show: { label: 'Mark no-show', title: 'Mark as a no-show?', confirm: 'Mark no-show', variant: 'danger', icon: HiOutlineUserRemove, tone: 'text-gray-600' },
};
const NEXT_STATUSES = { pending: ['confirmed', 'rejected', 'cancelled'], confirmed: ['completed', 'no_show', 'cancelled'] };

/* --------------------------- Book for a customer ---------------------------- */

const NewAppointmentModal = ({ isOpen, onClose, onCreated, services, stylists }) => {
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customerId: '', serviceId: '', employeeId: '', paymentMethod: 'cash', notes: '' });
  const [slot, setSlot] = useState({ date: '', time: '' });
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(customerSearch, 300);

  useEffect(() => {
    if (!isOpen) return;
    customerService.getAll(cleanParams({ search: debouncedSearch, status: 'active', limit: 20 }))
      .then(({ data }) => setCustomers(data))
      .catch(() => setCustomers([]));
  }, [isOpen, debouncedSearch]);

  useEffect(() => {
    if (isOpen) {
      setForm({ customerId: '', serviceId: '', employeeId: '', paymentMethod: 'cash', notes: '' });
      setSlot({ date: '', time: '' });
      setCustomerSearch('');
    }
  }, [isOpen]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value, ...(field === 'serviceId' ? { employeeId: '' } : {}) }));
    if (field === 'serviceId' || field === 'employeeId') setSlot({ date: '', time: '' });
  };

  const eligible = stylists.filter((stylist) => !form.serviceId || !stylist.services.length || stylist.services.some((s) => s.id === form.serviceId));
  const ready = form.customerId && form.serviceId && form.employeeId && slot.date && slot.time;

  const save = async () => {
    setSaving(true);
    try {
      await appointmentService.create({ ...form, date: slot.date, startTime: slot.time });
      toast.success('Appointment booked and confirmed');
      onCreated();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to book the appointment'));
      if (error.response?.status === 409) setSlot({ date: slot.date, time: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New appointment" size="lg">
      <div className="space-y-4">
        <div>
          <span className="label">Customer</span>
          <SearchInput value={customerSearch} onChange={setCustomerSearch} placeholder="Search customers by name, email or phone..." />
          <select className="input mt-2" value={form.customerId} onChange={(event) => update('customerId', event.target.value)} aria-label="Customer" size={Math.min(4, Math.max(2, customers.length))}>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name} ({customer.email})</option>
            ))}
          </select>
          {customers.length === 0 && <p className="text-xs text-gray-500 mt-1">No matching customers. Add walk-in customers from the Customers page.</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="new-service">Service</label>
            <select id="new-service" className="input" value={form.serviceId} onChange={(event) => update('serviceId', event.target.value)}>
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name} ({formatDuration(service.duration)}, {formatCurrency(service.price)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="new-stylist">Stylist</label>
            <select id="new-stylist" className="input" value={form.employeeId} onChange={(event) => update('employeeId', event.target.value)} disabled={!form.serviceId}>
              <option value="">Select a stylist</option>
              {eligible.map((stylist) => <option key={stylist.id} value={stylist.id}>{stylist.name}</option>)}
            </select>
          </div>
        </div>

        {form.serviceId && form.employeeId && (
          <DateSlotPicker serviceId={form.serviceId} employeeId={form.employeeId} value={slot} onChange={setSlot} />
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="new-method">Payment method</label>
            <select id="new-method" className="input" value={form.paymentMethod} onChange={(event) => update('paymentMethod', event.target.value)}>
              {['cash', 'pos', 'bank_transfer'].map((method) => <option key={method} value={method}>{PAYMENT_METHODS[method]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="new-notes">Notes (optional)</label>
            <input id="new-notes" className="input" maxLength={500} value={form.notes} onChange={(event) => update('notes', event.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Close</Button>
          <Button size="sm" onClick={save} loading={saving} disabled={!ready}>Book Appointment</Button>
        </div>
      </div>
    </Modal>
  );
};

/* ---------------------------------- Details --------------------------------- */

const DetailsModal = ({ appointment, onClose }) => (
  <Modal isOpen={Boolean(appointment)} onClose={onClose} title="Appointment details">
    {appointment && (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar src={appointment.customer?.avatar} name={appointment.customer?.name} size="lg" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{appointment.customer?.name}</p>
            <p className="text-sm text-gray-500 truncate">{appointment.customer?.email}</p>
            <p className="text-sm text-gray-500">{appointment.customer?.phone}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm bg-salon-bg rounded-2xl p-4">
          {[
            ['Reference', appointment.reference],
            ['Status', humanize(appointment.status)],
            ['Service', appointment.service?.name],
            ['Stylist', appointment.employee?.name],
            ['Date', formatDate(appointment.date, 'EEE, d MMM yyyy')],
            ['Time', `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`],
            ['Price', formatCurrency(appointment.price)],
            ['Payment', `${PAYMENT_METHODS[appointment.paymentMethod]} (${humanize(appointment.paymentStatus)})`],
            ['Booked on', formatDateTime(appointment.createdAt)],
            ['Reminder sent', appointment.reminderSentAt ? formatDateTime(appointment.reminderSentAt) : 'Not yet'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-gray-400">{label}</dt>
              <dd className="font-medium text-gray-900 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        {appointment.notes && <p className="text-sm text-gray-600"><span className="font-medium text-gray-900">Customer notes:</span> {appointment.notes}</p>}
        {appointment.cancelReason && <p className="text-sm text-gray-600"><span className="font-medium text-gray-900">Reason:</span> {appointment.cancelReason}</p>}
      </div>
    )}
  </Modal>
);

/* ----------------------------------- Page ----------------------------------- */

/** Appointment management: search, filter, approve, reject, cancel, reschedule, reassign and complete. */
const AdminAppointments = () => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', employee: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { appointment, status }
  const [deleting, setDeleting] = useState(null);
  const [reason, setReason] = useState('');
  const [working, setWorking] = useState(false);
  const [creating, setCreating] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, loading, refetch } = useFetch(
    () => appointmentService.getAll(cleanParams({ ...filters, search: debouncedSearch, page, limit: 10 })),
    [filters, debouncedSearch, page]
  );
  const stylists = useFetch(() => employeeService.getAll({ limit: 100, status: 'active' }));
  const services = useFetch(() => serviceService.getAll({ limit: 100, status: 'active' }));
  const stylistList = stylists.data?.data || [];
  const appointments = data?.data || [];

  useEffect(() => { setPage(1); }, [filters, debouncedSearch]);

  const setFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const hasFilters = search || Object.values(filters).some(Boolean);

  const runAction = async () => {
    const { appointment, status } = pendingAction;
    setWorking(true);
    try {
      const { message } = await appointmentService.updateStatus(appointment.id, status, reason || undefined);
      toast.success(message);
      setPendingAction(null);
      setReason('');
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update the appointment'));
    } finally {
      setWorking(false);
    }
  };

  const confirmDelete = async () => {
    setWorking(true);
    try {
      await appointmentService.remove(deleting.id);
      toast.success('Appointment deleted');
      setDeleting(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete the appointment'));
    } finally {
      setWorking(false);
    }
  };

  const action = pendingAction && ACTIONS[pendingAction.status];

  return (
    <div>
      <PageHeader title="Appointments" subtitle="Approve, reschedule and track every booking.">
        <Button size="sm" onClick={() => setCreating(true)}><HiOutlinePlus className="w-4 h-4" /> New Appointment</Button>
      </PageHeader>

      <div className="card !p-4 mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto_auto_auto]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search reference, customer or service..." />
        <select className="input" value={filters.status} onChange={(event) => setFilter('status', event.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}
        </select>
        <select className="input" value={filters.employee} onChange={(event) => setFilter('employee', event.target.value)} aria-label="Filter by stylist">
          <option value="">All stylists</option>
          {stylistList.map((stylist) => <option key={stylist.id} value={stylist.id}>{stylist.name}</option>)}
        </select>
        <input type="date" className="input" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} aria-label="From date" title="From date" />
        <input type="date" className="input" value={filters.to} min={filters.from} onChange={(event) => setFilter('to', event.target.value)} aria-label="To date" title="To date" />
        <Button variant="outline" disabled={!hasFilters} onClick={() => { setSearch(''); setFilters({ status: '', employee: '', from: '', to: '' }); }}>
          <HiOutlineRefresh className="w-4 h-4" /> Reset
        </Button>
      </div>

      {loading ? (
        <TableSkeleton cols={7} rows={8} />
      ) : appointments.length === 0 ? (
        <div className="card">
          <EmptyState icon={HiOutlineCalendar} title="No appointments found" message={hasFilters ? 'Try changing or resetting the filters.' : 'New bookings will appear here.'} />
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Customer</th><th>Service</th><th>Stylist</th><th>Date & time</th><th>Amount</th><th>Status</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => {
                  const isActive = ['pending', 'confirmed'].includes(appointment.status);
                  return (
                    <tr key={appointment.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={appointment.customer?.avatar} name={appointment.customer?.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[160px]">{appointment.customer?.name || 'Deleted customer'}</p>
                            <p className="text-xs text-gray-400 font-mono">{appointment.reference}</p>
                          </div>
                        </div>
                      </td>
                      <td>{appointment.service?.name}</td>
                      <td>{appointment.employee?.name}</td>
                      <td className="whitespace-nowrap">
                        {formatDate(appointment.date, 'EEE, d MMM yyyy')}
                        <span className="block text-xs text-gray-400">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                      </td>
                      <td>
                        {formatCurrency(appointment.price)}
                        <span className={`${getStatusColor(appointment.paymentStatus)} block w-fit mt-1`}>{humanize(appointment.paymentStatus)}</span>
                      </td>
                      <td><span className={getStatusColor(appointment.status)}>{humanize(appointment.status)}</span></td>
                      <td>
                        <div className="flex items-center justify-end gap-0.5">
                          {(NEXT_STATUSES[appointment.status] || []).map((status) => {
                            const { icon: Icon, label, tone } = ACTIONS[status];
                            return (
                              <button key={status} type="button" className={`icon-btn ${tone}`} title={label} aria-label={label} onClick={() => setPendingAction({ appointment, status })}>
                                <Icon className="w-5 h-5" />
                              </button>
                            );
                          })}
                          {isActive && (
                            <button type="button" className="icon-btn text-blue-600" title="Reschedule / assign stylist" aria-label="Reschedule or assign stylist" onClick={() => setRescheduling(appointment)}>
                              <HiOutlineCalendar className="w-5 h-5" />
                            </button>
                          )}
                          <button type="button" className="icon-btn" title="View details" aria-label="View details" onClick={() => setViewing(appointment)}>
                            <HiOutlineEye className="w-5 h-5" />
                          </button>
                          <button type="button" className="icon-btn text-red-500" title="Delete" aria-label="Delete" onClick={() => setDeleting(appointment)}>
                            <HiOutlineTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}

      <DetailsModal appointment={viewing} onClose={() => setViewing(null)} />
      <RescheduleModal appointment={rescheduling} onClose={() => setRescheduling(null)} onDone={refetch} stylists={stylistList.filter((stylist) => !rescheduling || !stylist.services.length || stylist.services.some((s) => s.id === rescheduling.service?.id))} />
      <NewAppointmentModal isOpen={creating} onClose={() => setCreating(false)} onCreated={refetch} services={services.data?.data || []} stylists={stylistList} />

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        onClose={() => { setPendingAction(null); setReason(''); }}
        onConfirm={runAction}
        loading={working}
        title={action?.title}
        confirmLabel={action?.confirm}
        variant={action?.variant}
        message={pendingAction ? `${pendingAction.appointment.customer?.name}: ${pendingAction.appointment.service?.name} on ${formatDate(pendingAction.appointment.date)} at ${formatTime(pendingAction.appointment.startTime)}. The customer will be notified by email.` : ''}
      >
        {action?.needsReason && (
          <Textarea label="Reason (shared with the customer)" rows={2} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
        )}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={working}
        title="Delete this appointment?"
        confirmLabel="Delete"
        message="This permanently removes the appointment and its unpaid payment record. Paid appointments cannot be deleted."
      />
    </div>
  );
};

export default AdminAppointments;
