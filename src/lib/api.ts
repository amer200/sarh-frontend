// src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('sarh_token');
            const subdomain = localStorage.getItem('sarh_tenant_subdomain') || 'alsarh-express';

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            if (subdomain && !config.headers['x-tenant-subdomain']) {
                config.headers['x-tenant-subdomain'] = subdomain;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;