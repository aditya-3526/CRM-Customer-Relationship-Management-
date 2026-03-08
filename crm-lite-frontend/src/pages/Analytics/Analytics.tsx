import React, { useState, useEffect } from "react";
import axios from "axios";
import { Users, DollarSign, Activity, TrendingUp, ChevronRight, Award, PieChart, MessageSquare, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { motion, Variants } from "framer-motion";
import { AnalyticsData, MonthlyRevenueItem, FilteredAnalyticsData } from "../../types";
import { API_ENDPOINTS } from "../../config/api";
import { subDays, startOfQuarter, startOfYear } from 'date-fns';

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface backdrop-blur-md p-3 border border-border shadow-xl rounded-xl">
        <p className="text-sm font-semibold text-brand-dark mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-brand-accent font-medium">
            Revenue: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

type DatePreset = '7d' | '30d' | 'quarter' | 'year' | 'custom';

const getDateRange = (preset: DatePreset): { start: Date; end: Date; compStart: Date; compEnd: Date } => {
  const end = new Date();
  let start: Date;
  let compStart: Date;
  let compEnd: Date;
  const dayMs = 24 * 60 * 60 * 1000;

  switch (preset) {
    case '7d':
      start = subDays(end, 7);
      compEnd = subDays(start, 1);
      compStart = subDays(compEnd, 7);
      break;
    case '30d':
      start = subDays(end, 30);
      compEnd = subDays(start, 1);
      compStart = subDays(compEnd, 30);
      break;
    case 'quarter':
      start = startOfQuarter(end);
      compEnd = subDays(start, 1);
      compStart = startOfQuarter(compEnd);
      break;
    case 'year':
      start = startOfYear(end);
      compEnd = subDays(start, 1);
      compStart = startOfYear(compEnd);
      break;
    default:
      start = subDays(end, 30);
      compEnd = subDays(start, 1);
      compStart = subDays(compEnd, 30);
  }
  return { start, end, compStart, compEnd };
};

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [filteredData, setFilteredData] = useState<FilteredAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<DatePreset>('year');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, monthlyRes, communicationsRes] = await Promise.all([
          axios.get(API_ENDPOINTS.analytics.summary),
          axios.get(API_ENDPOINTS.analytics.monthlyRevenue),
          axios.get(API_ENDPOINTS.analytics.communications),
        ]);

        setData({
          totalCustomers: summaryRes.data.data.totalCustomers,
          totalRevenue: summaryRes.data.data.totalRevenue,
          statusDistribution: summaryRes.data.data.statusDistribution,
          recentCustomers: summaryRes.data.data.recentCustomers,
          monthlyRevenue: monthlyRes.data.data,
          totalCommunications: communicationsRes.data.data.totalCommunications,
          communicationTypeDistribution: communicationsRes.data.data.typeDistribution,
          communicationStatusDistribution: communicationsRes.data.data.statusDistribution,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch filtered data when preset changes
  useEffect(() => {
    if (activePreset === 'custom') return;
    const fetchFiltered = async () => {
      setFilterLoading(true);
      try {
        const range = getDateRange(activePreset);
        const params = new URLSearchParams({
          startDate: range.start.toISOString(),
          endDate: range.end.toISOString(),
          compareStartDate: range.compStart.toISOString(),
          compareEndDate: range.compEnd.toISOString(),
        });
        const res = await axios.get(`${API_ENDPOINTS.analytics.filtered}?${params}`);
        setFilteredData(res.data.data);
      } catch (err) { /* silent */ }
      finally { setFilterLoading(false); }
    };
    fetchFiltered();
  }, [activePreset]);

  const handleCustomFilter = async () => {
    if (!customStart || !customEnd) return;
    setFilterLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: new Date(customStart).toISOString(),
        endDate: new Date(customEnd).toISOString(),
      });
      const res = await axios.get(`${API_ENDPOINTS.analytics.filtered}?${params}`);
      setFilteredData(res.data.data);
    } catch (err) { /* silent */ }
    finally { setFilterLoading(false); }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
    </div>
  );
  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-200">Error: {error}</div>;
  if (!data) return <div className="p-8 text-center text-brand-muted">No data available</div>;

  const getDelta = (key: 'customers' | 'revenue' | 'communications') => {
    if (!filteredData?.deltas) return null;
    const val = filteredData.deltas[key];
    return val;
  };

  const displayCustomers = filteredData ? filteredData.customers : data.totalCustomers;
  const displayRevenue = filteredData ? filteredData.revenue : data.totalRevenue;
  const displayComms = filteredData ? filteredData.communications : data.totalCommunications;

  const stats = [
    {
      label: "Total Customers",
      value: displayCustomers.toLocaleString(),
      Icon: Users,
      change: getDelta('customers'),
      positive: (getDelta('customers') ?? 0) >= 0,
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      label: "Total Revenue",
      value: `$${displayRevenue.toLocaleString()}`,
      Icon: DollarSign,
      change: getDelta('revenue'),
      positive: (getDelta('revenue') ?? 0) >= 0,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      label: "Total Interactions",
      value: displayComms.toString(),
      Icon: MessageSquare,
      change: getDelta('communications'),
      positive: (getDelta('communications') ?? 0) >= 0,
      color: "bg-purple-50 text-purple-600 border-purple-100"
    },
    {
      label: "Conversion Rate",
      value: "14.9%",
      Icon: TrendingUp,
      change: null,
      positive: false,
      color: "bg-amber-50 text-amber-600 border-amber-100"
    },
  ];

  const revenueData = data.monthlyRevenue.map((item: MonthlyRevenueItem) => ({
    month: new Date(item._id.year, item._id.month - 1).toLocaleString("default", { month: "short" }),
    revenue: item.totalRevenue,
  }));

  const funnelData = [
    { stage: "Leads", value: 450 },
    { stage: "Qualified", value: 280 },
    { stage: "Proposal", value: 150 },
    { stage: "Negotiation", value: 89 },
    { stage: "Closed Won", value: 67 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const presets: { key: DatePreset; label: string }[] = [
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-brand-dark tracking-tight">Business Analytics</h1>
          <p className="text-brand-muted mt-1">Actionable insights and performance metrics to drive revenue growth.</p>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-wrap items-center gap-3">
        <Calendar size={16} className="text-brand-muted" />
        <div className="flex bg-background p-1 rounded-xl gap-1 flex-wrap">
          {presets.map(p => (
            <button
              key={p.key}
              onClick={() => setActivePreset(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePreset === p.key
                  ? 'bg-brand-accent text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {activePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            />
            <span className="text-brand-muted text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            />
            <button
              onClick={handleCustomFilter}
              className="px-3 py-1.5 bg-brand-accent text-white text-xs font-medium rounded-lg hover:bg-brand-accent/90 transition-colors"
            >
              Apply
            </button>
          </div>
        )}
        {filterLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-accent"></div>}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div
            variants={itemVariants}
            key={stat.label}
            className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl ${stat.color.split(' ')[0]}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${stat.color}`}>
                <stat.Icon size={24} />
              </div>
              {stat.change !== null && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {stat.positive ? '+' : ''}{stat.change}%
                </span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-brand-muted mb-1">{stat.label}</h4>
              <p className="text-3xl font-heading font-bold text-brand-dark group-hover:scale-105 transition-transform origin-left">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-2xl border border-border shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-heading font-bold text-brand-dark">Revenue Growth Trend</h4>
            <div className="p-2 bg-brand-accent/10 text-brand-accent rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Funnel */}
        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-heading font-bold text-brand-dark">Sales Funnel</h4>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
              <PieChart size={18} />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-5">
            {funnelData.map((item, index) => {
              const percent = ((item.value / funnelData[0].value) * 100);
              return (
                <div key={item.stage} className="relative">
                  <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className="text-brand-dark">{item.stage}</span>
                    <span className="text-brand-dark">{item.value} <span className="text-brand-muted font-normal">({percent.toFixed(1)}%)</span></span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-accent to-brand-accent/80"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Breakdowns Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <h4 className="text-lg font-heading font-bold text-brand-dark mb-6 flex items-center gap-2">
            <Activity size={18} className="text-emerald-500" /> Interaction Types
          </h4>
          <div className="space-y-4">
            {data.communicationTypeDistribution.map((item, i) => {
              const percent = ((item.count / data.totalCommunications) * 100);
              const color = COLORS[i % COLORS.length];
              return (
                <div key={item._id}>
                  <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className="text-brand-dark">{item._id}</span>
                    <span className="text-brand-muted">{item.count}</span>
                  </div>
                  <div className="w-full bg-border flex h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <h4 className="text-lg font-heading font-bold text-brand-dark mb-6 flex items-center gap-2">
            <PieChart size={18} className="text-purple-500" /> Interaction Status
          </h4>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.communicationStatusDistribution} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#475569' }} width={80} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {data.communicationStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry._id === 'Completed' ? '#10b981' : entry._id === 'Scheduled' ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
          <h4 className="text-lg font-heading font-bold text-brand-dark mb-6 flex items-center gap-2">
            <Award size={18} className="text-amber-500" /> Top Customers
          </h4>
          <div className="space-y-4">
            {data.recentCustomers.slice(0, 5).map((customer, i) => (
              <div key={customer._id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-600' : 
                    i === 1 ? 'bg-slate-100 text-slate-600' : 
                    i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400 border border-gray-100'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-dark group-hover:text-brand-accent transition-colors">{customer.name}</p>
                    <p className="text-xs text-brand-muted">{customer.industry || 'General'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-500">${customer.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;