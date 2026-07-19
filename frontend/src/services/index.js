import api from './api';

export const appointmentService = {
  getAll: (params) => api.get('/appointments', { params }),
  getOne: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
  getSlots: (params) => api.get('/appointments/slots', { params }),
};

export const serviceService = {
  getAll: (params) => api.get('/services', { params }),
  getOne: (id) => api.get(`/services/${id}`),
  create: (formData) => api.post('/services', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/services/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/services/${id}`),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  create: (formData) => api.post('/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const employeeService = {
  getAll: (params) => api.get('/employees', { params }),
  getOne: (id) => api.get(`/employees/${id}`),
  getByService: (serviceId) => api.get(`/employees/by-service/${serviceId}`),
  create: (formData) => api.post('/employees', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/employees/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/employees/${id}`),
  updateAvailability: (id, data) => api.put(`/employees/${id}/availability`, data),
};

export const customerService = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  toggleStatus: (id) => api.patch(`/customers/${id}/toggle-status`),
};

export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  initialize: (data) => api.post('/payments/initialize', data),
  verify: (data) => api.post('/payments/verify', data),
  downloadReceipt: (id) => api.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
};

export const reviewService = {
  getAll: (params) => api.get('/reviews', { params }),
  create: (data) => api.post('/reviews', data),
  approve: (id) => api.patch(`/reviews/${id}/approve`),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export const galleryService = {
  getAll: (params) => api.get('/gallery', { params }),
  add: (formData) => api.post('/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/gallery/${id}`),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
  getActivity: () => api.get('/dashboard/activity'),
};

export const reportService = {
  getReport: (params) => api.get('/reports', { params }),
  exportPDF: (params) => api.get('/reports/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/reports/export/excel', { params, responseType: 'blob' }),
};

export const inventoryService = {
  getAll: (params) => api.get('/inventory', { params }),
  getAlerts: () => api.get('/inventory/alerts'),
  create: (formData) => api.post('/inventory', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/inventory/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/inventory/${id}`),
  addTransaction: (id, data) => api.post(`/inventory/${id}/transactions`, data),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const settingsService = {
  get: () => api.get('/settings'),
  update: (formData) => api.put('/settings', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
