import axios from 'axios';
import toast from 'react-hot-toast';
import config from '../config';

const API_BASE_URL = config.apiBaseUrl;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  customerLogin: (credentials) => api.post('/auth/customer-login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
};

// Receipts API
export const receiptsAPI = {
  getReceipts: (params) => api.get('/receipts', { params }),
  getReceipt: (id) => api.get(`/receipts/${id}`),
  createReceipt: (data) => api.post('/receipts', data),
  approveReceipt: (id, data) => api.post(`/receipts/${id}/approve`, data),
  rejectReceipt: (id, data) => api.post(`/receipts/${id}/reject`, data),
  searchReceipts: (searchTerm) => api.get(`/receipts/search?searchTerm=${searchTerm}`),
  getExpiringTokens: (days) => api.get(`/receipts/expiring-tokens?days=${days}`),
  getCustomerReceipts: () => api.get('/receipts/customer'),
  getReceiptsByPlot: (plotId) => api.get(`/receipts/plot/${plotId}`),
};

// Plots API
export const plotsAPI = {
  getPlots: (params) => api.get('/plots', { params }),
  getPlot: (id) => api.get(`/plots/${id}`),
  createPlot: (data) => api.post('/plots', data),
  bulkCreatePlots: (data) => api.post('/plots/bulk', data),
  updatePlot: (id, data) => api.put(`/plots/${id}`, data),
  deletePlot: (id) => api.delete(`/plots/${id}`),
  getAvailablePlots: (params) => api.get('/plots/available', { params }),
  updatePlotStatus: (id, status) => api.patch(`/plots/${id}/status`, { status }),
};

// Users API
export const usersAPI = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Payments API
export const paymentsAPI = {
  getPayments: (params) => api.get('/payments', { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
  createPayment: (data) => api.post('/payments', data),
  getPaymentSummary: (params) => api.get('/payments/summary', { params }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenueByMonth: () => api.get('/dashboard/revenue-by-month'),
  getSiteWiseStats: (params) => api.get('/dashboard/site-wise-stats', { params }),
  getAssociatePerformance: (params) => api.get('/dashboard/associate-performance', { params }),
  getPaymentMethodStats: (params) => api.get('/dashboard/payment-method-stats', { params }),
};

export default api;