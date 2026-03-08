export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  industry: string;
  location: string;
  status: "Active" | "Inactive" | "Pending";
  stage?: string;
  value: number;
  createdAt: string;
}

export interface Communication {
  _id: string;
  customerId: {
    _id: string;
    name: string;
  };
  type: "Email" | "Phone" | "Video Call" | "Meeting";
  priority: "High" | "Medium" | "Low";
  status: "Completed" | "Scheduled" | "Pending";
  notes: string;
  date: string;
}

export interface Reminder {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
  };
  title: string;
  description: string;
  dueDate: string;
  type: 'follow_up' | 'meeting' | 'task' | 'custom';
  status: 'pending' | 'completed' | 'overdue';
  createdAt: string;
}

export interface CustomerInsight {
  engagement_score: number;
  churn_risk: 'low' | 'medium' | 'high';
  recommended_action: string;
  summary: string;
  next_best_step: string;
}

export interface MonthlyRevenueItem {
  _id: {
    month: number;
    year: number;
  };
  totalRevenue: number;
  count: number;
}

export interface AnalyticsData {
  totalCustomers: number;
  totalRevenue: number;
  statusDistribution: {
    _id: "Active" | "Inactive" | "Pending";
    count: number;
  }[];
  recentCustomers: Customer[];
  monthlyRevenue: MonthlyRevenueItem[];
  totalCommunications: number;
  communicationTypeDistribution: {
    _id: string;
    count: number;
  }[];
  communicationStatusDistribution: {
    _id: string;
    count: number;
  }[];
}

export interface FilteredAnalyticsData {
  customers: number;
  revenue: number;
  communications: number;
  monthlyRevenue: MonthlyRevenueItem[];
  comparison?: {
    customers: number;
    revenue: number;
    communications: number;
  };
  deltas?: {
    customers: number;
    revenue: number;
    communications: number;
  };
}

export interface DashboardData {
  cards: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }[];
  lineData: {
    month: string;
    sales: number;
    customers: number;
  }[];
  barData: {
    type: string;
    count: number;
  }[];
  pieData: {
    name: string;
    value: number;
  }[];
  recentCustomers: Customer[];
}