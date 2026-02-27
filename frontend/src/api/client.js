import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor - Add token to requests
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

// Response interceptor - Handle errors globally
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ Ignore canceled/aborted requests (e.g. caused by navigation or component unmount)
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong!";

    const status = error.response?.status;

    if (status === 401) {
      const token = localStorage.getItem("token");
      const currentPath = window.location.pathname;

      // Only redirect if:
      // 1. User had a token (session expired)
      // 2. Not already on login/register page
      // 3. Not already redirecting
      if (token && !isRedirecting && currentPath !== '/login' && currentPath !== '/register') {
        isRedirecting = true;

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        toast.error("Session expired. Please login again.");

        setTimeout(() => {
          isRedirecting = false;
          window.location.replace("/login");
        }, 1000);
      }
    } else if (status !== 401) {
      // Show error toast for non-401 errors
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;