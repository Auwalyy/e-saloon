import api, { toFormData } from './api';

/**
 * One object per API resource. Every method returns the JSON body
 * (`{ success, data, pagination, ... }`) thanks to the response interceptor.
 */

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updateAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.put('/auth/avatar', form);
  },
};

export const appointmentService = {
  getAll: (params) => api.get('/appointments', { params }),
  getOne: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  updateStatus: (id, status, reason) => api.patch(`/appointments/${id}/status`, { status, reason }),
  cancel: (id, reason) => api.patch(`/appointments/${id}/cancel`, { reason }),
  reschedule: (id, data) => api.patch(`/appointments/${id}/reschedule`, data),
  remove: (id) => api.delete(`/appointments/${id}`),
  getSlots: (params) => api.get('/appointments/slots', { params }),
  getAvailableDates: (params) => api.get('/appointments/available-dates', { params }),
};

export const serviceService = {
  getAll: (params) => api.get('/services', { params }),
  getPopular: (limit = 6) => api.get('/services/popular', { params: { limit } }),
  getOne: (id) => api.get(`/services/${id}`),
  create: (data, file) => api.post('/services', toFormData(data, 'image', file)),
  update: (id, data, file) => api.put(`/services/${id}`, toFormData(data, 'image', file)),
  remove: (id) => api.delete(`/services/${id}`),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  create: (data, file) => api.post('/categories', toFormData(data, 'image', file)),
  update: (id, data, file) => api.put(`/categories/${id}`, toFormData(data, 'image', file)),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const employeeService = {
  getAll: (params) => api.get('/employees', { params }),
  getOne: (id) => api.get(`/employees/${id}`),
  getSchedule: (id, params) => api.get(`/employees/${id}/schedule`, { params }),
  create: (data, file) => api.post('/employees', toFormData(data, 'photo', file)),
  update: (id, data, file) => api.put(`/employees/${id}`, toFormData(data, 'photo', file)),
  remove: (id) => api.delete(`/employees/${id}`),
};

export const customerService = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  toggleStatus: (id) => api.patch(`/customers/${id}/toggle-status`),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const paymentService = {
  getConfig: () => api.get('/payments/config'),
  getAll: (params) => api.get('/payments', { params }),
  initialize: (appointmentId) => api.post('/payments/initialize', { appointmentId }),
  verify: (reference) => api.post('/payments/verify', { reference }),
  markPaid: (id, data) => api.patch(`/payments/${id}/mark-paid`, data),
  refund: (id, data) => api.patch(`/payments/${id}/refund`, data),
  remove: (id) => api.delete(`/payments/${id}`),
  downloadReceipt: (id) => api.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
  downloadInvoice: (id) => api.get(`/payments/${id}/invoice`, { responseType: 'blob' }),
};

export const reviewService = {
  getAll: (params) => api.get('/reviews', { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  remove: (id) => api.delete(`/reviews/${id}`),
};

export const galleryService = {
  getAll: (params) => api.get('/gallery', { params }),
  create: (data, file) => api.post('/gallery', toFormData(data, 'image', file)),
  update: (id, data, file) => api.put(`/gallery/${id}`, toFormData(data, 'image', file)),
  remove: (id) => api.delete(`/gallery/${id}`),
};

export const inventoryService = {
  getAll: (params) => api.get('/inventory', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  remove: (id) => api.delete(`/inventory/${id}`),
  getTransactions: (params) => api.get('/inventory/transactions', { params }),
  addTransaction: (id, data) => api.post(`/inventory/${id}/transactions`, data),
  getSuppliers: () => api.get('/inventory/suppliers'),
  createSupplier: (data) => api.post('/inventory/suppliers', data),
  updateSupplier: (id, data) => api.put(`/inventory/suppliers/${id}`, data),
  removeSupplier: (id) => api.delete(`/inventory/suppliers/${id}`),
};

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const settingsService = {
  get: () => api.get('/settings'),
  update: (data, file) => api.put('/settings', toFormData(data, 'logo', file)),
};

export const dashboardService = {
  get: () => api.get('/dashboard'),
};

export const reportService = {
  get: (params) => api.get('/reports', { params }),
  exportPdf: (params) => api.get('/reports/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/reports/export/excel', { params, responseType: 'blob' }),
};

export const contactService = {
  send: (data) => api.post('/contact', data),
  getAll: (params) => api.get('/contact', { params }),
  markRead: (id) => api.patch(`/contact/${id}/read`),
  remove: (id) => api.delete(`/contact/${id}`),
};
