import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiCheck, HiOutlineCalendar, HiOutlineCash, HiOutlineCheckCircle, HiOutlineClock, HiOutlineCreditCard,
  HiOutlineLibrary, HiOutlineScissors, HiOutlineUser,
} from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import { appointmentService, employeeService, paymentService, serviceService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { downloadBlob, formatCurrency, formatDate, formatDuration, formatTime } from '../../utils/helpers';
import PageHero from '../../components/common/PageHero';
import DateSlotPicker from '../../components/common/DateSlotPicker';
import SmartImage from '../../components/ui/SmartImage';
import Avatar from '../../components/ui/Avatar';
import StarRating from '../../components/ui/StarRating';
import SearchInput from '../../components/ui/SearchInput';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

const STEPS = ['Service', 'Stylist', 'Date & Time', 'Payment', 'Confirm'];
const DRAFT_KEY = 'bookingDraft';

const SALON_METHODS = [
  { value: 'cash', label: 'Cash at the salon', description: 'Pay in cash when you arrive.', icon: HiOutlineCash },
  { value: 'pos', label: 'Card (POS) at the salon', description: 'Pay with your debit card on our POS terminal.', icon: HiOutlineCreditCard },
  { value: 'bank_transfer', label: 'Bank transfer', description: 'Transfer at the salon and show your confirmation.', icon: HiOutlineLibrary },
];
const ONLINE_METHOD = {
  value: 'paystack', label: 'Pay online now', description: 'Pay securely by card with Paystack. Your booking is confirmed instantly.', icon: HiOutlineCreditCard,
};

const readDraft = () => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || {};
  } catch {
    return {};
  }
};

/** Progress indicator across the top of the wizard. */
const Stepper = ({ current, onStepClick }) => (
  <ol className="flex items-center justify-between mb-8" aria-label="Booking steps">
    {STEPS.map((label, index) => {
      const isDone = index < current;
      const isActive = index === current;
      return (
        <li key={label} className="flex-1 flex items-center last:flex-none">
          <button
            type="button"
            disabled={!isDone}
            onClick={() => onStepClick(index)}
            aria-current={isActive ? 'step' : undefined}
            className="flex flex-col items-center gap-1.5 disabled:cursor-default"
          >
            <span
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                isDone ? 'bg-gold-500 text-salon-dark' : isActive ? 'bg-salon-dark text-salon-dark' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {isDone ? <HiCheck className="w-5 h-5" /> : index + 1}
            </span>
            <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
          </button>
          {index < STEPS.length - 1 && <span className={`flex-1 h-0.5 mx-2 sm:mb-5 ${isDone ? 'bg-gold-500' : 'bg-gray-200'}`} />}
        </li>
      );
    })}
  </ol>
);

/** Running summary of the choices made so far. */
const Summary = ({ service, stylist, slot, method }) => (
  <aside className="card lg:sticky lg:top-24">
    <h2 className="font-semibold text-gray-900 font-sans mb-4">Booking Summary</h2>
    <dl className="space-y-3 text-sm">
      {[
        [HiOutlineScissors, 'Service', service?.name],
        [HiOutlineUser, 'Stylist', stylist?.name],
        [HiOutlineCalendar, 'Date', slot.date && formatDate(slot.date, 'EEE, d MMM yyyy')],
        [HiOutlineClock, 'Time', slot.time && formatTime(slot.time)],
        [HiOutlineCreditCard, 'Payment', method?.label],
      ].map(([Icon, label, value]) => (
        <div key={label} className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-gold-600 shrink-0" />
          <div className="min-w-0">
            <dt className="text-xs text-gray-400">{label}</dt>
            <dd className={value ? 'font-medium text-gray-900' : 'text-gray-400'}>{value || 'Not selected'}</dd>
          </div>
        </div>
      ))}
    </dl>
    {service && (
      <div className="mt-5 pt-4 border-t border-gray-100 space-y-1">
        <p className="flex justify-between text-sm text-gray-500"><span>Duration</span><span>{formatDuration(service.duration)}</span></p>
        <p className="flex justify-between font-bold text-gray-900 text-lg"><span>Total</span><span className="text-gold-700">{formatCurrency(service.price)}</span></p>
      </div>
    )}
  </aside>
);

/**
 * Booking wizard: Service -> Stylist -> Date & Time -> Payment -> Confirm.
 * Deep links such as /book?service=<id> or /book?stylist=<id> preselect a choice.
 */
const BookAppointment = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const draft = useMemo(readDraft, []);

  const [step, setStep] = useState(draft.step || 0);
  const [serviceId, setServiceId] = useState(params.get('service') || draft.serviceId || '');
  const [stylistId, setStylistId] = useState(params.get('stylist') || draft.stylistId || '');
  const [slot, setSlot] = useState(draft.slot || { date: '', time: '' });
  const [paymentMethod, setPaymentMethod] = useState(draft.paymentMethod || 'cash');
  const [notes, setNotes] = useState(draft.notes || '');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(null);

  const services = useFetch(() => serviceService.getAll({ limit: 100, sort: 'name' }));
  const allStylists = useFetch(() => employeeService.getAll({ limit: 50 }));
  const config = useFetch(() => paymentService.getConfig());

  const serviceList = services.data?.data || [];
  const stylistList = allStylists.data?.data || [];
  const service = serviceList.find((item) => item.id === serviceId);
  const stylist = stylistList.find((item) => item.id === stylistId);

  const onlineEnabled = Boolean(config.data?.data?.onlineEnabled);
  const methods = onlineEnabled ? [ONLINE_METHOD, ...SALON_METHODS] : SALON_METHODS;
  const method = methods.find((item) => item.value === paymentMethod) || SALON_METHODS[0];

  // A stylist with no services listed can perform any service.
  const canPerform = (person, id) => !person.services.length || person.services.some((item) => item.id === id);
  const eligibleStylists = serviceId ? stylistList.filter((person) => canPerform(person, serviceId)) : stylistList;

  // When arriving from a stylist's "Book" button, only show what that stylist offers.
  const visibleServices = serviceList.filter((item) => {
    const matchesSearch = !search || `${item.name} ${item.category?.name || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesStylist = !stylist || canPerform(stylist, item.id);
    return matchesSearch && matchesStylist;
  });

  // The saved draft is single-use: once restored, forget it.
  useEffect(() => { sessionStorage.removeItem(DRAFT_KEY); }, []);

  // Drop a preselected stylist who cannot do the chosen service.
  useEffect(() => {
    if (service && stylist && !canPerform(stylist, service.id)) setStylistId('');
  }, [service, stylist]);

  // Jump ahead when a deep link has already answered the first step.
  useEffect(() => {
    if (!draft.step && params.get('service') && service && step === 0) setStep(1);
  }, [service]); // eslint-disable-line react-hooks/exhaustive-deps

  const chooseService = (id) => {
    if (id !== serviceId) setSlot({ date: '', time: '' });
    setServiceId(id);
    setStep(1);
  };

  const chooseStylist = (id) => {
    if (id !== stylistId) setSlot({ date: '', time: '' });
    setStylistId(id);
    setStep(2);
  };

  const confirmBooking = async () => {
    if (!user) {
      // Keep the selections while the visitor signs in, then bring them straight back.
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step: 4, serviceId, stylistId, slot, paymentMethod, notes }));
      toast('Please sign in to confirm your booking');
      return navigate('/login', { state: { from: { pathname: location.pathname } } });
    }

    setSubmitting(true);
    try {
      const { data } = await appointmentService.create({
        serviceId, employeeId: stylistId, date: slot.date, startTime: slot.time, paymentMethod, notes,
      });
      sessionStorage.removeItem(DRAFT_KEY);

      if (paymentMethod === 'paystack') {
        try {
          const checkout = await paymentService.initialize(data.id);
          window.location.assign(checkout.data.authorizationUrl);
          return;
        } catch (error) {
          toast.error(`${getErrorMessage(error)} Your booking is saved. You can pay at the salon or retry from My Bookings.`);
        }
      }
      setBooked(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to complete your booking'));
      // Someone else took the slot: send the customer back to choose another time.
      if (error.response?.status === 409) {
        setSlot({ date: slot.date, time: '' });
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      downloadBlob(await paymentService.downloadInvoice(booked.payment.id), `invoice-${booked.reference}.pdf`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to download the invoice'));
    }
  };

  /* ------------------------------- Confirmation ------------------------------ */
  if (booked) {
    return (
      <section className="container-page py-16 max-w-2xl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card text-center !p-8 sm:!p-10">
          <HiOutlineCheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Booking received!</h1>
          <p className="text-gray-500 mt-2">
            A confirmation has been sent to <span className="font-medium text-gray-700">{user.email}</span>. We will let you know as
            soon as the salon confirms your appointment.
          </p>
          <dl className="mt-8 text-left bg-salon-bg rounded-2xl p-5 grid sm:grid-cols-2 gap-4 text-sm">
            {[
              ['Reference', booked.reference],
              ['Status', 'Awaiting confirmation'],
              ['Service', booked.service.name],
              ['Stylist', booked.employee.name],
              ['Date', formatDate(booked.date, 'EEEE, d MMMM yyyy')],
              ['Time', `${formatTime(booked.startTime)} - ${formatTime(booked.endTime)}`],
              ['Payment', method.label],
              ['Amount', formatCurrency(booked.price)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="font-semibold text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/my-bookings" className="btn-primary">View My Bookings</Link>
            <Button variant="secondary" onClick={downloadInvoice}>Download Invoice</Button>
          </div>
        </motion.div>
      </section>
    );
  }

  if (isAdmin) {
    return (
      <section className="container-page py-20">
        <EmptyState
          title="You are signed in as an administrator"
          message="Customers book from this page. To book on a customer's behalf, use Appointments in the admin dashboard."
          action={<Link to="/admin/appointments" className="btn-primary">Go to Appointments</Link>}
        />
      </section>
    );
  }

  const canContinue = [Boolean(service), Boolean(stylist), Boolean(slot.date && slot.time), Boolean(paymentMethod), true][step];

  return (
    <>
      <PageHero eyebrow="Online booking" title="Book an Appointment" subtitle="Five quick steps and your chair is reserved." />

      <section className="container-page py-10">
        <Stepper current={step} onStepClick={setStep} />

        <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
          <div className="card min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                {/* Step 1: service */}
                {step === 0 && (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                      <h2 className="text-2xl font-bold text-gray-900">Choose a service</h2>
                      <SearchInput value={search} onChange={setSearch} placeholder="Search services..." className="sm:w-64" />
                    </div>
                    {stylist && (
                      <p className="text-sm text-gray-500 mb-4">
                        Showing services offered by <span className="font-medium text-gray-800">{stylist.name}</span>.{' '}
                        <button type="button" onClick={() => setStylistId('')} className="text-gold-700 font-medium hover:underline">Show all services</button>
                      </p>
                    )}
                    {services.loading ? (
                      <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
                    ) : visibleServices.length === 0 ? (
                      <EmptyState icon={HiOutlineScissors} title="No services found" message="Try a different search term." />
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {visibleServices.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => chooseService(item.id)}
                            aria-pressed={item.id === serviceId}
                            className={`flex gap-3 p-3 rounded-2xl border-2 text-left transition-all hover:border-gold-400 hover:shadow-card ${
                              item.id === serviceId ? 'border-gold-500 bg-gold-50' : 'border-gray-100'
                            }`}
                          >
                            <SmartImage src={item.image} alt="" className="w-20 h-20 rounded-xl shrink-0" />
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold text-gray-900 truncate">{item.name}</span>
                              <span className="block text-xs text-gray-500">{item.category?.name}</span>
                              <span className="flex items-center justify-between mt-2 text-sm">
                                <span className="text-gray-500">{formatDuration(item.duration)}</span>
                                <span className="font-bold text-gold-700">{formatCurrency(item.price)}</span>
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Step 2: stylist */}
                {step === 1 && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose your stylist</h2>
                    <p className="text-sm text-gray-500 mb-5">Stylists who offer {service?.name || 'this service'}.</p>
                    {allStylists.loading ? (
                      <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
                    ) : eligibleStylists.length === 0 ? (
                      <EmptyState icon={HiOutlineUser} title="No stylist currently offers this service" message="Please choose a different service or contact the salon." />
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {eligibleStylists.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => chooseStylist(person.id)}
                            aria-pressed={person.id === stylistId}
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:border-gold-400 hover:shadow-card ${
                              person.id === stylistId ? 'border-gold-500 bg-gold-50' : 'border-gray-100'
                            }`}
                          >
                            <Avatar src={person.photo} name={person.name} size="lg" />
                            <span className="min-w-0">
                              <span className="block font-semibold text-gray-900">{person.name}</span>
                              <span className="block text-xs text-gold-700 font-medium">{person.specialization}</span>
                              <span className="flex items-center gap-2 mt-1.5">
                                <StarRating rating={person.rating.average} />
                                <span className="text-xs text-gray-500">{person.experienceYears} yrs exp.</span>
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Step 3: date and time */}
                {step === 2 && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Pick a date and time</h2>
                    <p className="text-sm text-gray-500 mb-5">Only dates and times that {stylist?.name} has free are selectable.</p>
                    <DateSlotPicker serviceId={serviceId} employeeId={stylistId} value={slot} onChange={setSlot} />
                  </>
                )}

                {/* Step 4: payment */}
                {step === 3 && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">How would you like to pay?</h2>
                    <p className="text-sm text-gray-500 mb-5">You will receive a receipt as soon as payment is recorded.</p>
                    <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                      {methods.map(({ value, label, description, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={paymentMethod === value}
                          onClick={() => setPaymentMethod(value)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                            paymentMethod === value ? 'border-gold-500 bg-gold-50' : 'border-gray-100 hover:border-gold-300'
                          }`}
                        >
                          <span className="w-11 h-11 rounded-xl bg-white shadow-sm text-gold-600 flex items-center justify-center shrink-0">
                            <Icon className="w-6 h-6" />
                          </span>
                          <span className="flex-1">
                            <span className="block font-semibold text-gray-900">{label}</span>
                            <span className="block text-sm text-gray-500">{description}</span>
                          </span>
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === value ? 'border-gold-500' : 'border-gray-300'}`}>
                            {paymentMethod === value && <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-6">
                      <Textarea
                        label="Notes for your stylist (optional)"
                        rows={3}
                        maxLength={500}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Allergies, preferred style, anything we should know..."
                      />
                    </div>
                  </>
                )}

                {/* Step 5: confirm */}
                {step === 4 && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Review and confirm</h2>
                    <p className="text-sm text-gray-500 mb-5">Please check the details before confirming.</p>
                    <div className="rounded-2xl bg-salon-bg p-5 flex flex-col sm:flex-row gap-5">
                      <SmartImage src={service?.image} alt="" className="w-full sm:w-36 h-36 rounded-xl shrink-0" />
                      <dl className="grid grid-cols-2 gap-4 text-sm flex-1">
                        {[
                          ['Service', service?.name],
                          ['Stylist', stylist?.name],
                          ['Date', formatDate(slot.date, 'EEE, d MMM yyyy')],
                          ['Time', formatTime(slot.time)],
                          ['Duration', service && formatDuration(service.duration)],
                          ['Payment', method.label],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt className="text-xs text-gray-400">{label}</dt>
                            <dd className="font-semibold text-gray-900">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    {notes && <p className="mt-4 text-sm text-gray-600"><span className="font-medium text-gray-800">Notes:</span> {notes}</p>}
                    {!user && (
                      <p className="mt-4 text-sm bg-gold-50 border border-gold-200 text-gold-800 rounded-xl px-4 py-3">
                        You will be asked to sign in or create a free account. Your selections are kept.
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0 || submitting}>Back</Button>
              {step < 4 ? (
                <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canContinue}>Continue</Button>
              ) : (
                <Button size="sm" onClick={confirmBooking} loading={submitting}>
                  {paymentMethod === 'paystack' ? `Confirm & Pay ${formatCurrency(service?.price)}` : 'Confirm Booking'}
                </Button>
              )}
            </div>
          </div>

          <Summary service={service} stylist={stylist} slot={slot} method={step >= 3 ? method : null} />
        </div>
      </section>
    </>
  );
};

export default BookAppointment;
