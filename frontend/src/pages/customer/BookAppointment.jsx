import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheckCircle, HiArrowLeft, HiArrowRight, HiClock, HiCalendar } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { serviceService, employeeService, appointmentService, paymentService } from '../../services/index';
import { formatCurrency, formatDate, formatTime } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import StarRating from '../../components/ui/StarRating';

const STEPS = ['Service', 'Stylist', 'Date & Time', 'Payment', 'Confirm'];

const BookAppointment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  const [selected, setSelected] = useState({
    service: null, stylist: null, date: '', slot: '', paymentMethod: 'paystack', notes: '',
  });

  useEffect(() => {
    serviceService.getAll({ limit: 50 }).then(({ data }) => {
      const svcs = data.data || [];
      setServices(svcs);
      const preService = searchParams.get('service');
      if (preService) {
        const found = svcs.find(s => s.id === preService);
        if (found) { setSelected(p => ({ ...p, service: found })); setStep(1); }
      }
    });
  }, []);

  useEffect(() => {
    if (selected.service) {
      employeeService.getByService(selected.service.id).then(({ data }) => {
        setStylists(data.data || []);
        const preEmp = searchParams.get('employee');
        if (preEmp) {
          const found = data.data?.find(e => e.id === preEmp);
          if (found) { setSelected(p => ({ ...p, stylist: found })); setStep(2); }
        }
      });
    }
  }, [selected.service]);

  useEffect(() => {
    if (selected.stylist && selected.service && selected.date) {
      setLoading(true);
      appointmentService.getSlots({ employee_id: selected.stylist.id, service_id: selected.service.id, date: selected.date })
        .then(({ data }) => setSlots(data.slots || []))
        .finally(() => setLoading(false));
    }
  }, [selected.stylist, selected.service, selected.date]);

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    setBooking(true);
    try {
      const { data: apptData } = await appointmentService.create({
        service_id: selected.service.id,
        employee_id: selected.stylist.id,
        appointment_date: selected.date,
        start_time: selected.slot,
        notes: selected.notes,
      });

      if (selected.paymentMethod !== 'cash') {
        const { data: payData } = await paymentService.initialize({
          appointment_id: apptData.data.id,
          method: selected.paymentMethod,
        });
        if (selected.paymentMethod === 'paystack' && payData.data?.authorization_url) {
          window.location.href = payData.data.authorization_url;
          return;
        }
      }

      toast.success('Appointment booked successfully! 🎉');
      navigate('/my-bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!selected.service;
    if (step === 1) return !!selected.stylist;
    if (step === 2) return !!selected.date && !!selected.slot;
    if (step === 3) return !!selected.paymentMethod;
    return true;
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-salon-bg py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-gray-900">Book an Appointment</h1>
          <p className="text-gray-500 mt-2">Complete the steps below to secure your booking</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-gold-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${i < step ? 'bg-gold-500 border-gold-500 text-white' : i === step ? 'border-gold-500 text-gold-600' : 'border-gray-200 text-gray-400'}`}>
                  {i < step ? <HiCheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${i < step ? 'bg-gold-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card min-h-64">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

              {/* Step 0: Service */}
              {step === 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Service</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {services.map(svc => (
                      <div key={svc.id} onClick={() => setSelected(p => ({ ...p, service: svc }))}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selected.service?.id === svc.id ? 'border-gold-500 bg-gold-50' : 'border-gray-100 hover:border-gold-200'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{svc.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{svc.category_name}</p>
                          </div>
                          {selected.service?.id === svc.id && <HiCheckCircle className="w-5 h-5 text-gold-500 shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-gold-600 font-bold text-sm">{formatCurrency(svc.price)}</span>
                          <span className="text-gray-400 text-xs flex items-center gap-1"><HiClock className="w-3 h-3" />{svc.duration}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Stylist */}
              {step === 1 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Stylist</h2>
                  {stylists.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No stylists available for this service</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stylists.map(emp => (
                        <div key={emp.id} onClick={() => setSelected(p => ({ ...p, stylist: emp }))}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${selected.stylist?.id === emp.id ? 'border-gold-500 bg-gold-50' : 'border-gray-100 hover:border-gold-200'}`}>
                          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                            {emp.avatar ? <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" /> :
                              <div className="w-full h-full bg-gold-500 flex items-center justify-center text-white font-bold">{emp.name?.[0]}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                            <p className="text-xs text-gray-400">{emp.specialization}</p>
                            <StarRating rating={parseFloat(emp.avg_rating)} size="sm" />
                          </div>
                          {selected.stylist?.id === emp.id && <HiCheckCircle className="w-5 h-5 text-gold-500 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Date & Time */}
              {step === 2 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Date & Time</h2>
                  <div className="mb-4">
                    <label className="label">Select Date</label>
                    <input type="date" className="input" min={minDate}
                      value={selected.date} onChange={e => setSelected(p => ({ ...p, date: e.target.value, slot: '' }))} />
                  </div>
                  {selected.date && (
                    <div>
                      <label className="label">Available Time Slots</label>
                      {loading ? <div className="flex justify-center py-6"><Spinner /></div> :
                        slots.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center py-6">No available slots for this date</p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {slots.map(slot => (
                              <button key={slot} onClick={() => setSelected(p => ({ ...p, slot }))}
                                className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${selected.slot === slot ? 'bg-gold-500 border-gold-500 text-white' : 'border-gray-200 text-gray-700 hover:border-gold-300'}`}>
                                {formatTime(slot)}
                              </button>
                            ))}
                          </div>
                        )
                      }
                    </div>
                  )}
                  <div className="mt-4">
                    <label className="label">Notes (optional)</label>
                    <textarea className="input resize-none" rows={3} placeholder="Any special requests..."
                      value={selected.notes} onChange={e => setSelected(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    {[
                      { id: 'paystack', label: 'Paystack', desc: 'Pay securely with card via Paystack' },
                      { id: 'flutterwave', label: 'Flutterwave', desc: 'Pay with Flutterwave' },
                      { id: 'cash', label: 'Pay on Arrival', desc: 'Pay cash when you arrive at the salon' },
                    ].map(method => (
                      <div key={method.id} onClick={() => setSelected(p => ({ ...p, paymentMethod: method.id }))}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selected.paymentMethod === method.id ? 'border-gold-500 bg-gold-50' : 'border-gray-100 hover:border-gold-200'}`}>
                        <div>
                          <p className="font-medium text-gray-900">{method.label}</p>
                          <p className="text-xs text-gray-400">{method.desc}</p>
                        </div>
                        {selected.paymentMethod === method.id && <HiCheckCircle className="w-5 h-5 text-gold-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Confirm */}
              {step === 4 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirm Booking</h2>
                  <div className="bg-gold-50 rounded-xl p-5 space-y-3">
                    {[
                      ['Service', selected.service?.name],
                      ['Category', selected.service?.category_name],
                      ['Stylist', selected.stylist?.name],
                      ['Date', formatDate(selected.date)],
                      ['Time', formatTime(selected.slot)],
                      ['Duration', `${selected.service?.duration} minutes`],
                      ['Payment', selected.paymentMethod],
                      ['Total', formatCurrency(selected.service?.price)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-900 capitalize">{value}</span>
                      </div>
                    ))}
                  </div>
                  {selected.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Notes: {selected.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <HiArrowLeft className="w-4 h-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              Next <HiArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleBook} loading={booking} disabled={!user}>
              {user ? 'Confirm Booking' : 'Login to Book'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
