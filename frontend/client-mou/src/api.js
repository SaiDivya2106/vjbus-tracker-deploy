import axios from 'axios';

// Create axios instance with base URL from environment
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Debug: Log the API URL (will be visible in browser console)
console.log('🔧 API Configuration:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
