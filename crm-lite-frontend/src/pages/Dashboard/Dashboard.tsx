import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  DollarSign,
  Users,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DashboardData } from "../../types";
import { API_ENDPOINTS } from "../../config/api";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, monthlyRes, customersRes, communicationsRes] = await Promise.all([
          axios.get(API_ENDPOINTS.analytics.summary),
          axios.get(API_ENDPOINTS.analytics.monthlyRevenue),
          axios.get(`${API_ENDPOINTS.customers}?limit=5&sort=-createdAt`),
          axios.get(API_ENDPOINTS.analytics.communications)
        ]);

        const statusDistribution = summaryRes.data.data.statusDistribution.reduce((acc: Record<string, number>, curr: { _id: string; count: number }) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {});

        const communicationTypeDistribution = communicationsRes.data.data.typeDistribution.reduce((acc: Record<string, number>, curr: { _id: string; count: number }) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {});

        setDashboardData({
          cards: [
            {
              title: "Total Revenue",
              value: `$${summaryRes.data.data.totalRevenue.toLocaleString()}`,
              icon: <DollarSign className="text-emerald-600 w-6 h-6" />,
              color: "bg-emerald-100",
            },
            {
              title: "Active Customers",
              value: summaryRes.data.data.totalCustomers,
              icon: <Users className="text-blue-600 w-6 h-6" />,
              color: "bg-blue-100",
            },
            {
              title: "Communications",
              value: communicationsRes.data.data.totalCommunications,
              icon: <MessageSquare className="text-amber-600 w-6 h-6" />,
              color: "bg-amber-100",
            },
            {
              title: "Growth Rate",
              value: "+18.4%",
              icon: <TrendingUp className="text-brand-accent w-6 h-6" />,
              color: "bg-brand-accent/20",
            },
          ],
          lineData: monthlyRes.data.data.map((item: any) => ({
            month: new Date(0, item._id.month - 1).toLocaleString('default', { month: 'short' }),
            sales: item.totalRevenue,
            customers: item.count
          })),
          barData: [
            { type: "Email", count: communicationTypeDistribution.Email || 0 },
            { type: "Phone", count: communicationTypeDistribution.Phone || 0 },
            { type: "Video Call", count: communicationTypeDistribution['Video Call'] || 0 },
            { type: "Meeting", count: communicationTypeDistribution.Meeting || 0 },
          ],
          pieData: [
            { name: "Active", value: statusDistribution.Active || 0 },
            { name: "Inactive", value: statusDistribution.Inactive || 0 },
            { name: "Pending", value: statusDistribution.Pending || 0 },
          ],
          recentCustomers: customersRes.data.data
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pieColors = ["#10B981", "#EF4444", "#F59E0B"]; // Emerald, Red, Amber

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
    </div>
  );
  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-200">Error loading dashboard: {error}</div>;
  if (!dashboardData) return <div className="p-8 text-center text-gray-500">No data available</div>;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold text-brand-dark tracking-tight">Dashboard Overview</h1>
          <p className="text-brand-muted mt-1">Here's what's happening with your business today.</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData.cards.map((card) => (
          <div
            key={card.title}
            className="bg-surface p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-medium text-brand-muted mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-brand-dark tracking-tight">{card.value}</p>
            </div>
            <div className={`p-4 rounded-xl ${card.color} transition-transform group-hover:scale-110`}>
              {card.icon}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <h2 className="text-lg font-heading font-semibold mb-6 text-brand-dark">
            Sales & Customers Trends
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="customers" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCustomers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <h2 className="text-lg font-heading font-semibold mb-6 text-brand-dark">
            Communication Methods
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Bottom Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="col-span-1 bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center">
          <h2 className="text-lg font-heading font-semibold mb-2 text-brand-dark self-start">
            Customer Status
          </h2>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {dashboardData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="col-span-1 lg:col-span-2 bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-heading font-semibold text-brand-dark">
              Recent Customers
            </h2>
            <button 
              onClick={() => navigate('/customers')}
              className="text-sm font-medium text-brand-accent hover:text-brand-accent/80 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-sm font-semibold text-brand-muted font-sans tracking-wide">Customer</th>
                  <th className="pb-3 text-sm font-semibold text-brand-muted font-sans tracking-wide">Location</th>
                  <th className="pb-3 text-sm font-semibold text-brand-muted font-sans tracking-wide text-right">Value</th>
                  <th className="pb-3 text-sm font-semibold text-brand-muted font-sans tracking-wide text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentCustomers.map((customer, idx) => (
                  <tr key={customer._id} className="border-b border-border/50 hover:bg-brand-accent/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold uppercase">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p 
                            onClick={() => navigate(`/customers/${customer._id}`)}
                            className="text-sm font-medium text-brand-dark hover:text-brand-accent cursor-pointer transition-colors"
                          >{customer.name}</p>
                          <p className="text-xs text-brand-muted">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-brand-muted">{customer.location || '—'}</td>
                    <td className="py-4 text-sm font-medium text-brand-dark text-right">${customer.value.toLocaleString()}</td>
                    <td className="py-4 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          customer.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : customer.status === "Pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;