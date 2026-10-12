import { useEffect, useMemo, useState } from 'react';
import {
  addMonths, eachDayOfInterval, endOfMonth, format, getDay, isBefore, startOfMonth, startOfToday,
} from 'date-fns';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { appointmentService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { formatTime, toDateString } from '../../utils/helpers';
import { Skeleton } from '../ui/Skeleton';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MAX_MONTHS_AHEAD = 3;

/**
 * Calendar + time-slot picker used when booking and rescheduling.
 * Only dates with free slots can be selected, and unavailable times are
 * disabled, so a customer cannot pick a slot that is already taken.
 *
 * `value` is `{ date: 'YYYY-MM-DD', time: 'HH:mm' }`.
 */
const DateSlotPicker = ({ serviceId, employeeId, value, onChange, excludeAppointmentId }) => {
  const today = useMemo(() => startOfToday(), []);
  const [month, setMonth] = useState(() => startOfMonth(value?.date ? new Date(`${value.date}T00:00:00`) : today));
  const [availableDates, setAvailableDates] = useState(new Set());
  const [slots, setSlots] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  const monthKey = format(month, 'yyyy-MM');
  const selectedDate = value?.date || '';

  // Which days of the visible month still have free slots?
  useEffect(() => {
    if (!serviceId || !employeeId) return undefined;
    let cancelled = false;
    setLoadingDates(true);
    setError('');
    appointmentService.getAvailableDates({ serviceId, employeeId, month: monthKey })
      .then(({ data }) => { if (!cancelled) setAvailableDates(new Set(data)); })
      .catch((err) => { if (!cancelled) { setAvailableDates(new Set()); setError(getErrorMessage(err)); } })
      .finally(() => { if (!cancelled) setLoadingDates(false); });
    return () => { cancelled = true; };
  }, [serviceId, employeeId, monthKey]);

  // Time slots for the chosen day.
  useEffect(() => {
    if (!serviceId || !employeeId || !selectedDate) {
      setSlots([]);
      return undefined;
    }
    let cancelled = false;
    setLoadingSlots(true);
    appointmentService.getSlots({ serviceId, employeeId, date: selectedDate, excludeAppointmentId })
      .then(({ data }) => { if (!cancelled) setSlots(data); })
      .catch((err) => { if (!cancelled) { setSlots([]); setError(getErrorMessage(err)); } })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [serviceId, employeeId, selectedDate, excludeAppointmentId]);

  const days = eachDayOfInterval({ start: month, end: endOfMonth(month) });
  const leadingBlanks = getDay(month);
  const canGoBack = !isBefore(addMonths(month, -1), startOfMonth(today));
  const canGoForward = isBefore(month, addMonths(startOfMonth(today), MAX_MONTHS_AHEAD));
  const freeSlots = slots.filter((slot) => slot.available).length;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button type="button" className="icon-btn" disabled={!canGoBack} onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <p className="font-semibold text-gray-900" aria-live="polite">{format(month, 'MMMM yyyy')}</p>
          <button type="button" className="icon-btn" disabled={!canGoForward} onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
            <HiChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day) => <span key={day} className="text-xs font-medium text-gray-400 py-1">{day}</span>)}
          {Array.from({ length: leadingBlanks }, (_, index) => <span key={`blank-${index}`} />)}
          {days.map((day) => {
            const dateString = toDateString(day);
            const isAvailable = availableDates.has(dateString);
            const isSelected = dateString === selectedDate;
            if (loadingDates) return <Skeleton key={dateString} className="aspect-square" />;
            return (
              <button
                key={dateString}
                type="button"
                disabled={!isAvailable}
                onClick={() => onChange({ date: dateString, time: '' })}
                aria-pressed={isSelected}
                aria-label={`${format(day, 'EEEE d MMMM')}${isAvailable ? '' : ', unavailable'}`}
                className={`aspect-square rounded-xl text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-gold-500 text-salon-dark shadow-md'
                    : isAvailable
                      ? 'bg-gold-50 text-gray-900 hover:bg-gold-200'
                      : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
        <p className="flex items-center gap-4 text-xs text-gray-500 mt-3">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gold-100 border border-gold-200" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gold-500" /> Selected</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100" /> Unavailable</span>
        </p>
      </div>

      {/* Time slots */}
      <div>
        <p className="font-semibold text-gray-900 mb-3">
          {selectedDate ? format(new Date(`${selectedDate}T00:00:00`), 'EEEE, d MMMM') : 'Available times'}
        </p>
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        {!selectedDate && <p className="text-sm text-gray-500">Choose a date to see the available times.</p>}
        {selectedDate && loadingSlots && (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, index) => <Skeleton key={index} className="h-10" />)}
          </div>
        )}
        {selectedDate && !loadingSlots && (
          <>
            {freeSlots === 0 && <p className="text-sm text-gray-500">No times left on this day. Please pick another date.</p>}
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {slots.map((slot) => {
                const isSelected = value?.time === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => onChange({ date: selectedDate, time: slot.time })}
                    aria-pressed={isSelected}
                    title={slot.available ? `${formatTime(slot.time)} - ${formatTime(slot.endTime)}` : 'Not available'}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      isSelected
                        ? 'bg-gold-500 border-gold-500 text-salon-dark shadow-md'
                        : slot.available
                          ? 'border-gray-200 text-gray-800 hover:border-gold-500 hover:text-gold-700 bg-white'
                          : 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed'
                    }`}
                  >
                    {formatTime(slot.time)}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DateSlotPicker;
