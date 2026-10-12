import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineCamera, HiOutlineCash, HiOutlineCreditCard } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import useDocuments from '../../hooks/useDocuments';
import { appointmentService, authService, paymentService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, formatDateTime, formatTime, getStatusColor, humanize, PAYMENT_METHODS } from '../../utils/helpers';
import { rules, applyServerErrors } from '../../utils/validation';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton, Spinner } from '../../components/ui/Skeleton';

const TABS = [
  { value: 'profile', label: 'Profile' },
  { value: 'appointments', label: 'Appointment History' },
  { value: 'payments', label: 'Payments & Receipts' },
  { value: 'security', label: 'Password' },
];

/* ------------------------------ Profile details ----------------------------- */

const ProfileForm = () => {
  const { user, updateUser } = useAuth();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting, isDirty }, reset } = useForm({
    defaultValues: { name: user.name, phone: user.phone || '', address: user.address || '' },
  });

  const onSubmit = async (values) => {
    try {
      const { user: updated } = await authService.updateProfile(values);
      updateUser(updated);
      reset({ name: updated.name, phone: updated.phone || '', address: updated.address || '' });
      toast.success('Profile updated');
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error, 'Unable to update your profile'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 max-w-2xl" noValidate>
      <h2 className="text-xl font-bold text-gray-900">Personal details</h2>
      <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name', rules.name)} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Email" value={user.email} disabled readOnly />
        <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone', rules.optionalPhone)} />
      </div>
      <Input label="Address" autoComplete="street-address" maxLength={250} error={errors.address?.message} {...register('address')} />
      <p className="text-xs text-gray-400">Your email address identifies your account and cannot be changed here.</p>
      <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save Changes</Button>
    </form>
  );
};

/* ---------------------------- Appointment history --------------------------- */

const AppointmentHistory = () => {
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch(() => appointmentService.getAll({ page, limit: 8 }), [page]);
  const documents = useDocuments();
  const rows = data?.data || [];

  if (loading) return <TableSkeleton cols={6} />;
  if (rows.length === 0) {
    return (
      <div className="card">
        <EmptyState icon={HiOutlineCalendar} title="No appointments yet" action={<Link to="/book" className="btn-primary">Book your first visit</Link>} />
      </div>
    );
  }
  return (
    <>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Reference</th><th>Service</th><th>Stylist</th><th>Date</th><th>Amount</th><th>Status</th><th className="text-right">Receipt</th></tr>
          </thead>
          <tbody>
            {rows.map((appointment) => (
              <tr key={appointment.id}>
                <td className="font-mono text-xs">{appointment.reference}</td>
                <td className="font-medium text-gray-900">{appointment.service?.name}</td>
                <td>{appointment.employee?.name}</td>
                <td className="whitespace-nowrap">{formatDate(appointment.date)}<span className="text-gray-400"> · {formatTime(appointment.startTime)}</span></td>
                <td>{formatCurrency(appointment.price)}</td>
                <td><span className={getStatusColor(appointment.status)}>{humanize(appointment.status)}</span></td>
                <td className="text-right">
                  {appointment.payment?.receiptNumber ? (
                    <Button size="sm" variant="ghost" loading={documents.busyId === appointment.payment.id} onClick={() => documents.downloadReceipt(appointment.payment)}>
                      Download
                    </Button>
                  ) : <span className="text-gray-300">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={data.pagination} onPageChange={setPage} />
      <p className="text-sm text-gray-500 mt-4">
        To cancel, reschedule or review an appointment, go to <Link to="/my-bookings" className="text-gold-700 font-medium hover:underline">My Bookings</Link>.
      </p>
    </>
  );
};

/* --------------------------------- Payments --------------------------------- */

const PaymentHistory = () => {
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch(() => paymentService.getAll({ page, limit: 8 }), [page]);
  const documents = useDocuments();
  const rows = data?.data || [];

  if (loading) return <TableSkeleton cols={6} />;
  if (rows.length === 0) {
    return <div className="card"><EmptyState icon={HiOutlineCreditCard} title="No payments yet" message="Payments for your bookings will be listed here." /></div>;
  }
  return (
    <>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Payment ID</th><th>Service</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th className="text-right">Documents</th></tr>
          </thead>
          <tbody>
            {rows.map((payment) => (
              <tr key={payment.id}>
                <td className="font-mono text-xs">{payment.reference}</td>
                <td className="font-medium text-gray-900">{payment.appointment?.service?.name || '-'}</td>
                <td>{formatCurrency(payment.amount)}</td>
                <td>{PAYMENT_METHODS[payment.method]}</td>
                <td><span className={getStatusColor(payment.status)}>{payment.status === 'success' ? 'Paid' : humanize(payment.status)}</span></td>
                <td className="whitespace-nowrap">{formatDateTime(payment.paidAt || payment.createdAt)}</td>
                <td className="text-right whitespace-nowrap">
                  {payment.receiptNumber ? (
                    <Button size="sm" variant="ghost" loading={documents.busyId === payment.id} onClick={() => documents.downloadReceipt(payment)}>Receipt</Button>
                  ) : payment.status === 'pending' ? (
                    <Button size="sm" variant="ghost" loading={documents.busyId === payment.id} onClick={() => documents.downloadInvoice(payment)}>Invoice</Button>
                  ) : <span className="text-gray-300">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={data.pagination} onPageChange={setPage} />
    </>
  );
};

/* ------------------------------ Change password ----------------------------- */

const PasswordForm = () => {
  const { startSession } = useAuth();
  const { register, handleSubmit, watch, reset, setError, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (values) => {
    try {
      // The API issues a fresh session because the old token is invalidated.
      startSession(await authService.changePassword(values));
      reset();
      toast.success('Password changed successfully');
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error, 'Unable to change your password'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 max-w-lg" noValidate>
      <h2 className="text-xl font-bold text-gray-900">Change password</h2>
      <PasswordInput label="Current password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword', rules.required('Current password'))} />
      <PasswordInput label="New password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword', rules.password)} />
      <PasswordInput
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword', {
          required: 'Please confirm your new password',
          validate: (value) => value === watch('newPassword') || 'Passwords do not match',
        })}
      />
      <Button type="submit" loading={isSubmitting}>Update Password</Button>
    </form>
  );
};

/* ----------------------------------- Page ----------------------------------- */

/** Customer account area: details and photo, appointment history, payments and password. */
const Profile = () => {
  const { user, updateUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const tab = TABS.some((item) => item.value === params.get('tab')) ? params.get('tab') : 'profile';

  const stats = useFetch(() => Promise.all([
    appointmentService.getAll({ limit: 1 }),
    appointmentService.getAll({ scope: 'upcoming', limit: 1 }),
    paymentService.getAll({ status: 'success', limit: 100 }),
  ]));
  const [all, upcoming, paid] = stats.data || [];

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file');
    if (file.size > 3 * 1024 * 1024) return toast.error('Image is too large (maximum 3 MB)');
    setUploading(true);
    try {
      const { user: updated } = await authService.updateAvatar(file);
      updateUser(updated);
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to upload your photo'));
    } finally {
      setUploading(false);
    }
  };

  const tiles = [
    { icon: HiOutlineCalendar, label: 'Total bookings', value: all?.pagination.total },
    { icon: HiOutlineCalendar, label: 'Upcoming', value: upcoming?.pagination.total },
    { icon: HiOutlineCash, label: 'Total spent', value: paid && formatCurrency(paid.data.reduce((sum, payment) => sum + payment.amount, 0)) },
  ];

  return (
    <section className="container-page py-10">
      {/* Header card */}
      <div className="card flex flex-col md:flex-row md:items-center gap-6">
        <div className="relative self-start">
          <Avatar src={user.avatar} name={user.name} size="xl" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gold-500 hover:bg-gold-600 text-salon-dark flex items-center justify-center shadow-md border-2 border-white"
          >
            {uploading ? <Spinner size="sm" className="[&_svg]:text-salon-dark" /> : <HiOutlineCamera className="w-4 h-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={uploadPhoto} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{user.name}</h1>
          <p className="text-gray-500 truncate">{user.email}</p>
          <p className="text-xs text-gray-400 mt-1">Member since {formatDate(user.createdAt, 'MMMM yyyy')}</p>
        </div>
        <dl className="grid grid-cols-3 gap-3 md:gap-6 text-center">
          {tiles.map(({ icon: Icon, label, value }) => (
            <div key={label} className="px-2">
              <Icon className="w-5 h-5 text-gold-600 mx-auto" />
              <dd className="text-lg font-bold text-gray-900 mt-1">{value ?? '-'}</dd>
              <dt className="text-xs text-gray-500">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide my-6" role="tablist">
        {TABS.map((item) => (
          <button key={item.value} type="button" role="tab" aria-selected={tab === item.value} onClick={() => setParams({ tab: item.value }, { replace: true })} className={`tab ${tab === item.value ? 'tab-active' : 'bg-white shadow-sm'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileForm />}
      {tab === 'appointments' && <AppointmentHistory />}
      {tab === 'payments' && <PaymentHistory />}
      {tab === 'security' && <PasswordForm />}
    </section>
  );
};

export default Profile;
