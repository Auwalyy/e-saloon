/**
 * Booking availability engine.
 *
 * A stylist is bookable at a given time when:
 *   1. the salon is open and the stylist works that weekday,
 *   2. the whole service fits inside both sets of hours,
 *   3. the time is not in the past, and
 *   4. none of the 15-minute blocks it covers is already reserved.
 */
const { BookedSlot, Employee, Service, Setting } = require('../models');
const AppError = require('../utils/AppError');
const { timeToMinutes, minutesToTime, weekdayOf, nowInZone, addDays, DATE_PATTERN } = require('../utils/time');

const BLOCK = BookedSlot.BLOCK_MINUTES;
const MAX_ADVANCE_DAYS = 90;
const MIN_LEAD_MINUTES = 30;

/** Blocks (minutes since midnight) covered by an appointment. */
const blocksFor = (startMinutes, duration) => {
  const blocks = [];
  for (let minute = startMinutes; minute < startMinutes + duration; minute += BLOCK) blocks.push(minute);
  return blocks;
};

/** Bookable window for a stylist on a weekday, or null when unavailable. */
const workingWindow = (settings, employee, weekday) => {
  const salon = settings.openingHours.find((h) => h.day === weekday);
  const staff = employee.workingHours.find((h) => h.day === weekday);
  if (!salon || !salon.isOpen || !staff || !staff.isWorking) return null;

  const start = Math.max(timeToMinutes(salon.open), timeToMinutes(staff.start));
  const end = Math.min(timeToMinutes(salon.close), timeToMinutes(staff.end));
  return end > start ? { start, end } : null;
};

/** Pure slot calculation, shared by the day view and the month view. */
const computeSlots = ({ settings, employee, duration, date, takenBlocks, now }) => {
  const window = workingWindow(settings, employee, weekdayOf(date));
  if (!window) return [];
  if (date < now.date || date > addDays(now.date, MAX_ADVANCE_DAYS)) return [];

  const slots = [];
  // Align the first slot to the booking grid.
  const first = Math.ceil(window.start / BLOCK) * BLOCK;
  for (let start = first; start + duration <= window.end; start += settings.slotIntervalMinutes) {
    const isPast = date === now.date && start < now.minutes + MIN_LEAD_MINUTES;
    const isTaken = blocksFor(start, duration).some((block) => takenBlocks.has(block));
    slots.push({ time: minutesToTime(start), endTime: minutesToTime(start + duration), available: !isPast && !isTaken });
  }
  return slots;
};

const loadContext = async (serviceId, employeeId) => {
  const [service, employee, settings] = await Promise.all([
    Service.findById(serviceId),
    Employee.findById(employeeId),
    Setting.getMain(),
  ]);
  if (!service || !service.isActive) throw AppError.notFound('Service');
  if (!employee || !employee.isActive) throw AppError.notFound('Stylist');
  if (employee.services.length && !employee.services.some((id) => id.equals(service._id))) {
    throw AppError.badRequest('This stylist does not offer the selected service');
  }
  return { service, employee, settings };
};

/** All slots for one day, each flagged available or not. */
const getSlotsForDate = async ({ serviceId, employeeId, date, excludeAppointmentId }) => {
  if (!DATE_PATTERN.test(date || '')) throw AppError.badRequest('Date must be in YYYY-MM-DD format');
  const { service, employee, settings } = await loadContext(serviceId, employeeId);

  const filter = { employee: employee._id, date };
  if (excludeAppointmentId) filter.appointment = { $ne: excludeAppointmentId };
  const taken = await BookedSlot.find(filter).select('block').lean();

  return computeSlots({
    settings, employee, date,
    duration: service.duration,
    takenBlocks: new Set(taken.map((slot) => slot.block)),
    now: nowInZone(settings.timezone),
  });
};

/** Dates within a month (YYYY-MM) that still have at least one free slot. */
const getAvailableDates = async ({ serviceId, employeeId, month }) => {
  if (!/^\d{4}-\d{2}$/.test(month || '')) throw AppError.badRequest('Month must be in YYYY-MM format');
  const { service, employee, settings } = await loadContext(serviceId, employeeId);

  const taken = await BookedSlot.find({ employee: employee._id, date: { $regex: `^${month}-` } })
    .select('date block').lean();
  const takenByDate = taken.reduce((map, slot) => {
    if (!map.has(slot.date)) map.set(slot.date, new Set());
    map.get(slot.date).add(slot.block);
    return map;
  }, new Map());

  const now = nowInZone(settings.timezone);
  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  const dates = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const slots = computeSlots({
      settings, employee, date, now,
      duration: service.duration,
      takenBlocks: takenByDate.get(date) || new Set(),
    });
    if (slots.some((slot) => slot.available)) dates.push(date);
  }
  return dates;
};

/**
 * Validates that a requested start time is a real, free slot.
 * Returns the context needed to build the appointment.
 */
const assertSlotIsBookable = async ({ serviceId, employeeId, date, startTime, excludeAppointmentId }) => {
  const slots = await getSlotsForDate({ serviceId, employeeId, date, excludeAppointmentId });
  const slot = slots.find((candidate) => candidate.time === startTime);
  if (!slot) throw AppError.badRequest('The selected time is outside working hours');
  if (!slot.available) throw AppError.conflict('That time slot is no longer available. Please choose another.');
  return slot;
};

/**
 * Atomically reserves the blocks for an appointment.
 * Throws 409 if any block was taken by a concurrent booking.
 */
const reserveSlots = async ({ appointmentId, employeeId, date, startTime, duration }) => {
  const documents = blocksFor(timeToMinutes(startTime), duration).map((block) => ({
    appointment: appointmentId, employee: employeeId, date, block,
  }));
  try {
    await BookedSlot.insertMany(documents, { ordered: true });
  } catch (error) {
    // Roll back any blocks inserted before the conflict was detected.
    await BookedSlot.deleteMany({ appointment: appointmentId, employee: employeeId, date });
    if (error.code === 11000) {
      throw AppError.conflict('That time slot was just booked by someone else. Please choose another.');
    }
    throw error;
  }
};

const releaseSlots = (appointmentId) => BookedSlot.deleteMany({ appointment: appointmentId });

module.exports = { getSlotsForDate, getAvailableDates, assertSlotIsBookable, reserveSlots, releaseSlots };
