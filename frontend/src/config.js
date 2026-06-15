export const API_URL = window.location.hostname.endsWith('.github.io')
  ? 'https://bactwin-helper-backend.onrender.com' // Location of backend deployment
  : import.meta.env.VITE_API_URL || 'http://localhost:4000';