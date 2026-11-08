import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('carevisit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Don't toast for conflict previews (status 409) since we handle them in dedicated modals
    if (error.response?.status === 401) {
      localStorage.removeItem('carevisit_token');
      localStorage.removeItem('carevisit_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    } else if (error.response?.status !== 409) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;
