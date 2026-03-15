// ============================================================
// Axios instance with JWT interceptor
// CONFIGURED FOR NGROK HTTPS TUNNEL
// ============================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken } from '@/utils/storage';

// ============================================================
// NGROK SETUP INSTRUCTIONS:
// 1. Run: ngrok http 8080
// 2. Copy your ngrok HTTPS URL (e.g., https://abc123.ngrok-free.app)
// 3. Replace the URL below with your ngrok URL
// ============================================================

// IMPORTANT: Replace 'YOUR_NGROK_URL' with your actual ngrok URL
// Format: https://YOUR_NGROK_URL/api (no trailing slash)
const BASE_URL = 'http://10.119.119.17:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- Request interceptor: attach JWT ----
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[API Request]', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error: AxiosError) => {
    console.log('[API Request Error]', error.message);
    return Promise.reject(error);
  },
);

// ---- Response interceptor: global error handling ----
api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    // FULL ERROR LOGGING - Required for debugging network issues
    console.log('========== FULL AXIOS ERROR ==========');
    console.log('error:', error);
    console.log('error.response:', error.response);
    console.log('error.request:', error.request);
    console.log('error.message:', error.message);
    console.log('error.code:', error.code);
    console.log('error.config:', error.config);
    console.log('=====================================');
    
    if (error.response) {
      // Server responded with an error status code (4xx, 5xx)
      const status = error.response.status;
      console.log('[API Error Response Status]:', status);
      console.log('[API Error Response Data]:', error.response.data);
      
      if (status === 401) {
        console.warn('Unauthorized – token may be expired');
      }
      if (status === 403) {
        console.warn('Forbidden – check permissions');
      }
      if (status === 500) {
        console.error('Server error', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response received - NETWORK ERROR
      console.error('==========================================');
      console.error('NETWORK ERROR - No response received!');
      console.error('This means the request did NOT reach the server.');
      console.error('Possible causes:');
      console.error('1. ngrok not running (run: ngrok http 8080)');
      console.error('2. Wrong ngrok URL in api.ts');
      console.error('3. ngrok tunnel expired (restart ngrok)');
      console.error('4. Backend not running on port 8080');
      console.error('5. Firewall blocking the connection');
      console.error('==========================================');
    } else {
      // Something else happened
      console.error('Error setting up the request:', error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
export { BASE_URL };
