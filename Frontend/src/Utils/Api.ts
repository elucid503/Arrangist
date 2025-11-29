import axios from 'axios';

const ApiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api';

const Api = axios.create({
  baseURL: ApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
Api.interceptors.request.use((config) => {
  const Token = localStorage.getItem('token');
  if (Token) {
    config.headers.Authorization = `Bearer ${Token}`;
  }
  return config;
});

// Custom event for auth state changes
export const AuthEvents = {
  onLogout: new Set<() => void>(),
  triggerLogout: () => {
    AuthEvents.onLogout.forEach((callback) => callback());
  },
};

// Handle 401 errors
Api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear auth and redirect if we had a token (user was logged in)
      const HadToken = localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (HadToken) {
        // Use custom event to trigger logout in React context instead of hard redirect
        AuthEvents.triggerLogout();
      }
    }
    return Promise.reject(error);
  }
);

export default Api;
