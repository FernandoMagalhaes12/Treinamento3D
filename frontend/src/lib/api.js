const envBackendUrl = process.env.REACT_APP_BACKEND_URL;

// Keep local development working even if .env is missing.
const BACKEND_URL = envBackendUrl || 'http://localhost:8000';
const API_BASE = `${BACKEND_URL}/api`;

export { BACKEND_URL, API_BASE };
