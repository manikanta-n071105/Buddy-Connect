/// <reference types="vite/client" />
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { encryptPayload, decryptPayload } from '../utils/encryption';
import { secureGetItem, secureSetItem, secureRemoveItem } from '../utils/secureStorage';
import { dedupeRequest } from '../utils/concurrency';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Auth injection + End-to-End Application Layer Payload Encryption
api.interceptors.request.use(async (config) => {
  const token = secureGetItem('accessToken') || localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Signal to the backend that the client supports End-to-End Encryption
  config.headers['X-Client-E2EE'] = 'true';

  // Check if payload should be encrypted
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  const isBlob = typeof Blob !== 'undefined' && config.data instanceof Blob;
  const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && config.data instanceof ArrayBuffer;

  if (config.data && !isFormData && !isBlob && !isArrayBuffer) {
    const method = (config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      try {
        const encrypted = await encryptPayload(config.data);
        if (encrypted && encrypted.__e2ee) {
          config.data = encrypted;
          config.headers['X-Payload-Encrypted'] = 'true';
        }
      } catch (err) {
        console.warn('[E2EE] Request encryption skipped:', err);
      }
    }
  }

  return config;
});

// Response Interceptor: End-to-End Decryption + Token Refresh Handling
api.interceptors.response.use(
  async (response) => {
    // If response payload is encrypted with E2EE, decrypt it back to normal JSON
    if (
      response.data &&
      (response.data.__e2ee === true ||
        response.headers?.['x-payload-encrypted'] === 'true' ||
        response.headers?.['x-payload-encrypted'] === '1')
    ) {
      try {
        response.data = await decryptPayload(response.data);
      } catch (err) {
        console.error('[E2EE] Response decryption failed:', err);
      }
    }
    return response;
  },
  async (error) => {
    // If error payload is encrypted, decrypt it for readable error messages
    if (
      error.response?.data &&
      (error.response.data.__e2ee === true ||
        error.response.headers?.['x-payload-encrypted'] === 'true')
    ) {
      try {
        error.response.data = await decryptPayload(error.response.data);
      } catch {
        // preserve original error
      }
    }

    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = secureGetItem('refreshToken') || localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await api.post(`/auth/refresh`, { refreshToken });
          const { accessToken } = res.data.data.tokens;
          secureSetItem('accessToken', accessToken);
          localStorage.setItem('accessToken', accessToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api(error.config);
        } catch (refreshErr) {
          secureRemoveItem('accessToken');
          secureRemoveItem('refreshToken');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// In-Flight Request Deduplication for GET requests
// Automatically coalesces duplicate concurrent HTTP requests fired at the same moment (e.g. React StrictMode, multiple components mounting)
const originalGet = api.get.bind(api);
(api as any).get = (url: string, config?: any) => {
  const dedupeKey = `GET:${url}:${JSON.stringify(config?.params || {})}`;
  return dedupeRequest(dedupeKey, () => originalGet(url, config));
};

export default api;
