import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (date, fmt = 'MMM dd, yyyy') => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) ? format(d, fmt) : '-';
  } catch { return '-'; }
};

export const formatTime = (time) => {
  if (!time) return '-';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export const formatCurrency = (amount) =>
  `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export const getStatusColor = (status) => {
  const map = {
    pending: 'badge-gold',
    confirmed: 'badge-blue',
    in_progress: 'badge-blue',
    completed: 'badge-green',
    cancelled: 'badge-red',
    no_show: 'badge-gray',
    paid: 'badge-green',
    unpaid: 'badge-red',
    success: 'badge-green',
    failed: 'badge-red',
    refunded: 'badge-gray',
  };
  return map[status] || 'badge-gray';
};

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const truncate = (str, n = 60) => str?.length > n ? str.slice(0, n) + '...' : str;

export const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
