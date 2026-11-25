// The one API both tenants' apps talk to (same logic as src/services/api.js).
const DEFAULT_API_BASE_URL = 'https://gym-membership-f3ua.onrender.com/api/v1';

const initial = () => {
  let stored = null;
  try {
    stored = localStorage.getItem('gym_api_base_url');
  } catch {
    // Storage can be unavailable (private mode); fall back to the env.
  }
  return (stored || import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
};

export const API_BASE_URL = initial();
