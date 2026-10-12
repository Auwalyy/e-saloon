import { format, parseISO, isValid } from 'date-fns';

/** Formats an ISO timestamp or "YYYY-MM-DD" string. */
export const formatDate = (date, pattern = 'd MMM yyyy') => {
  if (!date) return '-';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsed) ? format(parsed, pattern) : '-';
};

export const formatDateTime = (date) => formatDate(date, 'd MMM yyyy, h:mm a');

/** "14:30" -> "2:30 PM" */
export const formatTime = (time) => {
  if (!time) return '-';
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
};

export const formatCurrency = (amount, { compact = false } = {}) =>
  `₦${Number(amount || 0).toLocaleString('en-NG', compact
    ? { notation: 'compact', maximumFractionDigits: 1 }
    : { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** 90 -> "1 hr 30 min" */
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
};

/** "bank_transfer" -> "Bank transfer" */
export const humanize = (value = '') => {
  const text = String(value).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const STATUS_BADGES = {
  pending: 'badge-gold',
  confirmed: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
  rejected: 'badge-red',
  no_show: 'badge-gray',
  paid: 'badge-green',
  unpaid: 'badge-gold',
  success: 'badge-green',
  failed: 'badge-red',
  refunded: 'badge-gray',
};
export const getStatusColor = (status) => STATUS_BADGES[status] || 'badge-gray';

export const PAYMENT_METHODS = {
  cash: 'Cash',
  pos: 'POS / Card at salon',
  bank_transfer: 'Bank transfer',
  paystack: 'Online (Paystack)',
};

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Local calendar date as "YYYY-MM-DD" (never shifted by the UTC conversion). */
export const toDateString = (date = new Date()) => format(date, 'yyyy-MM-dd');

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const getInitials = (name) =>
  name?.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?';

/** Removes empty values so they are not sent as query parameters. */
export const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null));
