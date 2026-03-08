

import React, { ReactNode, useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart2,
  Settings,
  Bell,
  Search,
  KanbanSquare,
  Moon,
  Sun,
  LogOut,
  User,
  Menu,
  X,
  Check,
  CheckCheck,
  Sparkles,
  Clock as ClockIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_ENDPOINTS } from "../config/api";
import { Customer } from "../types";
import toast from "react-hot-toast";

const navItems = [
  { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
  { name: "Pipeline", icon: <KanbanSquare size={20} />, path: "/pipeline" },
  { name: "Customers", icon: <Users size={20} />, path: "/customers" },
  { name: "Communications", icon: <MessageSquare size={20} />, path: "/communications" },
  { name: "Analytics", icon: <BarChart2 size={20} />, path: "/analytics" },
  { name: "Reminders", icon: <ClockIcon size={20} />, path: "/reminders" },
];

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nlResults, setNlResults] = useState<Customer[]>([]);
  const [nlDescription, setNlDescription] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [showNlResults, setShowNlResults] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: "New Lead assigned", message: "Acme Corp was assigned to you.", time: "2 hours ago", read: false },
    { id: 2, title: "Meeting Reminder", message: "Follow up with TechFlow in 15 mins.", time: "5 hours ago", read: false },
    { id: 3, title: "Deal Closed", message: "TechVentures is now Closed Won!", time: "1 day ago", read: true },
  ]);

  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Fetch upcoming reminder count
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.remindersUpcoming);
        setReminderCount(res.data.count || 0);
      } catch (err) { /* silent */ }
    };
    fetchReminders();
    const iv = setInterval(fetchReminders, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowNlResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Debounced NL search
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 5) {
      setNlResults([]);
      setShowNlResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setNlLoading(true);
      setShowNlResults(true);
      try {
        const res = await axios.post(API_ENDPOINTS.ai.naturalSearch, { query });
        setNlResults(res.data.data.customers || []);
        setNlDescription(res.data.data.description || '');
      } catch (err) {
        // Fallback to simple name search
        try {
          const res = await axios.get(`${API_ENDPOINTS.customers}?search=${query}`);
          setNlResults(res.data.data?.slice(0, 10) || []);
          setNlDescription(`Text search for "${query}"`);
        } catch { /* silent */ }
      } finally {
        setNlLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/customers');
      setShowNlResults(false);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleNotificationClick = (notif: Notification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setShowNotifications(false);
    // Navigate based on content
    if (notif.title.includes("Lead")) {
      navigate('/pipeline');
    } else if (notif.title.includes("Meeting")) {
      navigate('/communications');
    } else {
      navigate('/customers');
    }
  };

  const handleViewAll = () => {
    setShowNotifications(false);
    navigate('/communications');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-background font-sans text-brand-dark overflow-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] bg-surface border-r border-border flex flex-col items-stretch shadow-soft
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-accent/30">
              C
            </div>
            <h1 className="text-xl font-heading font-bold tracking-tight text-brand-dark">CRM Lite</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-brand-muted hover:text-brand-dark">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-brand-muted uppercase tracking-wider mb-4">Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "text-brand-accent"
                    : "text-brand-muted hover:bg-brand-accent/5 hover:text-brand-dark"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-brand-accent/10 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`mr-3 relative z-10 ${isActive ? 'text-brand-accent' : 'text-brand-muted group-hover:text-brand-dark transition-colors'}`}>
                  {item.icon}
                </span>
                <span className="relative z-10">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-border">
          <div 
            onClick={logout}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 cursor-pointer transition-colors border border-transparent hover:border-red-500/20 group"
          >
            <div className="w-10 h-10 rounded-full bg-brand-accent text-white flex items-center justify-center font-bold text-lg group-hover:bg-red-500 transition-colors">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-semibold text-brand-dark group-hover:text-red-600 transition-colors truncate">{user?.name}</span>
              <span className="text-xs text-brand-muted group-hover:text-red-500 transition-colors truncate">{user?.email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="h-16 lg:h-20 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
          {/* Left side: hamburger on mobile, date on desktop */}
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-brand-muted hover:text-brand-dark rounded-lg">
              <Menu size={22} />
            </button>
            <span className="hidden md:block text-sm text-brand-muted font-medium tracking-wide">{format(new Date(), 'EEEE, MMMM do')}</span>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative hidden sm:block" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 5 && setShowNlResults(true)}
                  placeholder="✨ AI Search — try 'customers in California'" 
                  className="pl-10 pr-4 py-2 bg-background border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all w-48 lg:w-80 text-brand-dark placeholder-brand-muted"
                />
              </form>

              <AnimatePresence>
                {showNlResults && (searchQuery.length >= 5) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 right-0 mt-2 bg-surface border border-border shadow-xl rounded-2xl overflow-hidden z-50"
                  >
                    {nlDescription && (
                      <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                        <Sparkles size={14} className="text-brand-accent" />
                        <p className="text-xs text-brand-muted">{nlDescription}</p>
                      </div>
                    )}
                    {nlLoading ? (
                      <div className="px-4 py-6 text-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-accent mx-auto mb-2"></div>
                        <p className="text-xs text-brand-muted">AI is searching...</p>
                      </div>
                    ) : nlResults.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        {nlResults.map((c) => (
                          <button
                            key={c._id}
                            onClick={() => { navigate(`/customers/${c._id}`); setShowNlResults(false); setSearchQuery(''); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-accent/5 transition-colors text-left border-b border-border/50 last:border-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {c.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-brand-dark truncate">{c.name}</p>
                              <p className="text-xs text-brand-muted truncate">{c.location || c.industry || c.email}</p>
                            </div>
                            <span className="text-xs font-semibold text-emerald-500">${c.value?.toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-brand-muted">
                        No results found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowSettings(false);
                }}
                className="p-2 text-brand-muted hover:text-brand-dark hover:bg-brand-accent/5 rounded-full transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-surface border border-border shadow-lg rounded-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-border flex justify-between items-center">
                      <h3 className="font-semibold text-brand-dark">Notifications</h3>
                      <button 
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs text-brand-accent hover:text-brand-accent/80 font-medium transition-colors"
                      >
                        <CheckCheck size={12} /> Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 border-b border-border/50 hover:bg-brand-accent/5 transition-colors cursor-pointer ${!notif.read ? 'bg-brand-accent/5' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-brand-dark">{notif.title}</p>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-brand-accent rounded-full shrink-0 mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-xs text-brand-muted mt-1">{notif.message}</p>
                          <p className="text-xs text-brand-accent mt-2">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center border-t border-border">
                      <button 
                        onClick={handleViewAll}
                        className="text-sm font-medium text-brand-accent hover:text-brand-accent/80 transition-colors"
                      >
                        View all →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={settingsRef}>
              <button 
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowNotifications(false);
                }}
                className="p-2 text-brand-muted hover:text-brand-dark hover:bg-brand-accent/5 rounded-full transition-colors"
              >
                <Settings size={20} />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-surface border border-border shadow-lg rounded-2xl overflow-hidden z-50 py-2"
                  >
                    <div className="px-4 py-2 border-b border-border mb-2">
                      <p className="text-sm font-semibold text-brand-dark truncate">{user?.name}</p>
                      <p className="text-xs text-brand-muted truncate">{user?.email}</p>
                    </div>
                    
                    <button className="w-full flex items-center px-4 py-2.5 text-sm text-brand-dark hover:bg-brand-accent/5 transition-colors">
                      <User size={16} className="mr-3 text-brand-muted" />
                      Profile Settings
                    </button>
                    
                    <button 
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-brand-dark hover:bg-brand-accent/5 transition-colors"
                    >
                      <div className="flex items-center">
                        {theme === 'dark' ? (
                          <Sun size={16} className="mr-3 text-brand-muted" />
                        ) : (
                          <Moon size={16} className="mr-3 text-brand-muted" />
                        )}
                        Dark Mode
                      </div>
                      <div className={`w-8 h-4 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-brand-accent' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-4' : ''}`} />
                      </div>
                    </button>
                    
                    <div className="border-t border-border mt-2 pt-2">
                      <button 
                        onClick={logout}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={16} className="mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Scrolling Content */}
        <main className="flex-1 overflow-y-auto w-full relative bg-background">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
