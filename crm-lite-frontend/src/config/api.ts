// API base URL.
//
// Resolution order:
//   1. REACT_APP_API_BASE_URL, if set at BUILD time (not runtime — CRA inlines
//      env vars into the bundle during `npm run build`).
//   2. '/api' — a same-origin relative path. This is the production default and
//      assumes nginx proxies /api to the Node server. It sidesteps CORS and
//      mixed-content entirely, and means the bundle is not pinned to a hostname.
//
// For local development, create crm-lite-frontend/.env.local containing:
//   REACT_APP_API_BASE_URL=http://localhost:5000/api
// and make sure the server is on the same port (server/.env -> PORT=5000).
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || '/api';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    me: `${API_BASE_URL}/auth/me`,
  },
  customers: `${API_BASE_URL}/customers`,
  communications: `${API_BASE_URL}/communications`,
  draftEmail: `${API_BASE_URL}/communications/draft-email`,
  analytics: {
    summary: `${API_BASE_URL}/analytics/summary`,
    monthlyRevenue: `${API_BASE_URL}/analytics/monthly-revenue`,
    communications: `${API_BASE_URL}/analytics/communications`,
    filtered: `${API_BASE_URL}/analytics/filtered`,
  },
  ai: {
    customerInsights: `${API_BASE_URL}/ai/customer-insights`,
    naturalSearch: `${API_BASE_URL}/ai/natural-search`,
  },
  reminders: `${API_BASE_URL}/reminders`,
  remindersUpcoming: `${API_BASE_URL}/reminders/upcoming`,
};
