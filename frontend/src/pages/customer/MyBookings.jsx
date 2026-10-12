import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineUser } from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import useDocuments from '../../hooks/useDocuments';
import { appointmentService, paymentService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatCurrency, formatDate, formatTime, getStatusColor, humanize, PAYMENT_METHODS } from '../../utils/helpers';
import PageHero from '../../components/common/PageHero';
import RescheduleModal from '../../components/common/RescheduleModal';
import ReviewModal from '../../components/common/ReviewModal';
import SmartImage from '../../components/ui/SmartImage';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Textarea from '../../components/ui/Textarea';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/ui/Motion';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past & Cancelled' },
];

/** The customer's appointments, with reschedule, cancel, pay, receipt and review actions. */
const MyBookings = () => {
  const [scope, setScope] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [rescheduling, setRescheduling] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [working, setWorking] = useState(false);
  const documents = useDocuments();

  const { data, loading, refetch } = useFetch(() => appointmentService.getAll({ scope, page, limit: 6 }), [scope, page]);
  const config = useFetch(() => paymentService.getConfig());
  const onlineEnabled = Boolean(config.data?.data?.onlineEnabled);
  const appointments = data?.data || [];

  const switchTab = (value) => {
    setScope(value);
    setPage(1);
  };

  const confirmCancel = async () => {
    setWorking(true);
    try {
      await appointmentService.cancel(cancelling.id, cancelReason);
      toast.success('Appointment cancelled');
      setCancelling(null);
      setCancelReason('');
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to cancel this appointment'));
    } finally {
      setWorking(false);
    }
  };

  const payOnline = async (appointment) => {
    try {
      const { data: checkout } = await paymentService.initialize(appointment.id);
      window.location.assign(checkout.authorizationUrl);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to start the payment'));
    }
  };

  return (
    <>
      <PageHero eyebrow="Your account" title="My Bookings" subtitle="Manage upcoming visits and look back at past ones." />

      <section className="container-page py-10 max-w-4xl">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex gap-2" role="tablist">
            {TABS.map((tab) => (
              <button key={tab.value} type="button" role="tab" aria-selected={scope === tab.value} onClick={() => switchTab(tab.value)} className={`tab ${scope === tab.value ? 'tab-active' : 'bg-white shadow-sm'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <Link to="/book" className="btn-primary !py-2 !px-4 !text-sm">New Booking</Link>
        </div>

        {loading ? (
          <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : appointments.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={HiOutlineCalendar}
              title={scope === 'upcoming' ? 'No upcoming appointments' : 'No past appointments yet'}
              message={scope === 'upcoming' ? 'Ready for a fresh look? Book your next visit now.' : 'Your completed and cancelled visits will appear here.'}
              action={scope === 'upcoming' && <Link to="/book" className="btn-primary">Book an Appointment</Link>}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment, index) => {
              const { payment } = appointment;
              const isActive = ['pending', 'confirmed'].includes(appointment.status);
              const isPaid = payment?.status === 'success';
              return (
                <Reveal key={appointment.id} delay={index * 0.04}>
                  <article className="card !p-0 overflow-hidden flex flex-col sm:flex-row">
                    <SmartImage src={appointment.service?.image} alt="" className="h-36 sm:h-auto sm:w-44 shrink-0" />
                    <div className="p-5 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 font-sans">{appointment.service?.name}</h2>
                          <p className="text-xs text-gray-400">{appointment.reference}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={getStatusColor(appointment.status)}>{humanize(appointment.status)}</span>
                          <span className={getStatusColor(appointment.paymentStatus)}>{humanize(appointment.paymentStatus)}</span>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-2 mt-4 text-sm text-gray-600">
                        <p className="flex items-center gap-2"><HiOutlineCalendar className="w-4 h-4 text-gold-600" />{formatDate(appointment.date, 'EEE, d MMM yyyy')}</p>
                        <p className="flex items-center gap-2"><HiOutlineClock className="w-4 h-4 text-gold-600" />{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</p>
                        <p className="flex items-center gap-2"><HiOutlineUser className="w-4 h-4 text-gold-600" />{appointment.employee?.name}</p>
                      </div>

                      {appointment.cancelReason && (
                        <p className="text-sm text-gray-500 mt-3"><span className="font-medium">Reason:</span> {appointment.cancelReason}</p>
                      )}

                      <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                        <p className="text-sm text-gray-500">
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(appointment.price)}</span>{' '}
                          · {PAYMENT_METHODS[appointment.paymentMethod]}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {isActive && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setRescheduling(appointment)}>Reschedule</Button>
                              <Button size="sm" variant="outline" className="!text-red-600 hover:!border-red-400" onClick={() => setCancelling(appointment)}>Cancel</Button>
                            </>
                          )}
                          {isActive && !isPaid && onlineEnabled && payment && (
                            <Button size="sm" onClick={() => payOnline(appointment)}>Pay Now</Button>
                          )}
                          {payment && !isPaid && isActive && (
                            <Button size="sm" variant="outline" loading={documents.busyId === payment.id} onClick={() => documents.downloadInvoice(payment)}>Invoice</Button>
                          )}
                          {payment?.receiptNumber && (
                            <Button size="sm" variant="outline" loading={documents.busyId === payment.id} onClick={() => documents.downloadReceipt(payment)}>Receipt</Button>
                          )}
                          {appointment.status === 'completed' && !appointment.hasReview && (
                            <Button size="sm" variant="secondary" onClick={() => setReviewing(appointment)}>Leave Review</Button>
                          )}
                          {appointment.hasReview && <span className="badge-green self-center">Reviewed</span>}
                        </div>
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </div>
        )}
      </section>

      <RescheduleModal appointment={rescheduling} onClose={() => setRescheduling(null)} onDone={refetch} />
      <ReviewModal appointment={reviewing} onClose={() => setReviewing(null)} onSubmitted={refetch} />
      <ConfirmDialog
        isOpen={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={confirmCancel}
        loading={working}
        title="Cancel this appointment?"
        confirmLabel="Yes, cancel it"
        message={cancelling ? `${cancelling.service?.name} on ${formatDate(cancelling.date)} at ${formatTime(cancelling.startTime)} will be cancelled and the time released.` : ''}
      >
        <Textarea label="Reason (optional)" rows={2} maxLength={500} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
      </ConfirmDialog>
    </>
  );
};

export default MyBookings;
