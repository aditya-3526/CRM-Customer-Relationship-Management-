export const API_BASE_URL = 'http://localhost:3001/api';

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