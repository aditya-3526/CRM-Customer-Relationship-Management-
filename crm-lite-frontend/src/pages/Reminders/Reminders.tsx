import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { Reminder, Customer } from '../../types';
import { Modal } from '../../components/Modal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bell, Plus, CheckCircle2, Clock, AlertTriangle,
  Calendar, Trash2, User, Phone, Video, RotateCcw
} from 'lucide-react';
import { format, parseISO, isToday, isBefore, isAfter, startOfDay } from 'date-fns';

const Reminders = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    type: 'follow_up' as 'follow_up' | 'meeting' | 'task' | 'custom',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [remRes, custRes] = await Promise.all([
        axios.get(API_ENDPOINTS.reminders),
        axios.get(API_ENDPOINTS.customers),
      ]);
      setReminders(remRes.data.data);
      setCustomers(custRes.data.data);
    } catch (err) {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(API_ENDPOINTS.reminders, formData);
      setReminders([res.data.data, ...reminders]);
      setShowAddModal(false);
      setFormData({ customerId: '', title: '', description: '', dueDate: new Date().toISOString().split('T')[0], type: 'follow_up' });
      toast.success('Reminder created');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create reminder');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await axios.put(`${API_ENDPOINTS.reminders}/${id}`, { status: 'completed' });
      setReminders(reminders.map(r => r._id === id ? res.data.data : r));
      toast.success('Marked complete');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_ENDPOINTS.reminders}/${id}`);
      setReminders(reminders.filter(r => r._id !== id));
      toast.success('Deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleReopen = async (id: string) => {
    try {
      const res = await axios.put(`${API_ENDPOINTS.reminders}/${id}`, { status: 'pending' });
      setReminders(reminders.map(r => r._id === id ? res.data.data : r));
      toast.success('Reopened');
    } catch (err) {
      toast.error('Failed to reopen');
    }
  };

  const overdue = reminders.filter(r => r.status === 'overdue');
  const today = reminders.filter(r => r.status === 'pending' && isToday(parseISO(r.dueDate)));
  const upcoming = reminders.filter(r => r.status === 'pending' && isAfter(parseISO(r.dueDate), startOfDay(new Date())) && !isToday(parseISO(r.dueDate)));
  const completed = reminders.filter(r => r.status === 'completed');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'follow_up': return <Phone size={14} />;
      case 'meeting': return <Video size={14} />;
      case 'task': return <CheckCircle2 size={14} />;
      default: return <Bell size={14} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'follow_up': return 'Follow-up';
      case 'meeting': return 'Meeting';
      case 'task': return 'Task';
      default: return 'Custom';
    }
  };

  const inputClass = "w-full px-3 py-2 border border-border rounded-lg bg-background text-brand-dark text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all";

  const ReminderCard = ({ reminder }: { reminder: Reminder }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-surface border border-border rounded-xl p-4 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              reminder.type === 'follow_up' ? 'bg-blue-500/15 text-blue-500' :
              reminder.type === 'meeting' ? 'bg-purple-500/15 text-purple-500' :
              reminder.type === 'task' ? 'bg-emerald-500/15 text-emerald-500' :
              'bg-amber-500/15 text-amber-500'
            }`}>
              {getTypeIcon(reminder.type)}
              {getTypeLabel(reminder.type)}
            </span>
          </div>
          <p className="text-sm font-semibold text-brand-dark truncate">{reminder.title}</p>
          {reminder.description && (
            <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{reminder.description}</p>
          )}
          <button
            onClick={() => navigate(`/customers/${reminder.customerId?._id}`)}
            className="flex items-center gap-1 text-xs text-brand-accent hover:underline mt-2"
          >
            <User size={12} />
            {reminder.customerId?.name || 'Unknown'}
          </button>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {reminder.status !== 'completed' ? (
            <button
              onClick={() => handleComplete(reminder._id)}
              className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
              title="Mark complete"
            >
              <CheckCircle2 size={14} />
            </button>
          ) : (
            <button
              onClick={() => handleReopen(reminder._id)}
              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Reopen"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            onClick={() => handleDelete(reminder._id)}
            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-xs text-brand-muted">
        <Calendar size={12} />
        {format(parseISO(reminder.dueDate), 'MMM d, yyyy')}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  const Column = ({ title, items, color, icon }: { title: string; items: Reminder[]; color: string; icon: React.ReactNode }) => (
    <div className="flex-1 min-w-[280px]">
      <div className={`flex items-center gap-2 mb-4 px-1`}>
        <span className={`${color}`}>{icon}</span>
        <h3 className="text-sm font-bold text-brand-dark">{title}</h3>
        <span className="text-xs font-medium text-brand-muted bg-background px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map(r => <ReminderCard key={r._id} reminder={r} />)
        ) : (
          <div className="py-8 text-center text-brand-muted text-xs border border-dashed border-border rounded-xl">
            No {title.toLowerCase()} reminders
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-brand-dark tracking-tight">Reminders</h1>
          <p className="text-brand-muted mt-1">Track follow-ups, meetings, and tasks for your customers.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Add Reminder
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-2">
        <Column title="Overdue" items={overdue} color="text-red-500" icon={<AlertTriangle size={16} />} />
        <Column title="Today" items={today} color="text-amber-500" icon={<Clock size={16} />} />
        <Column title="Upcoming" items={upcoming} color="text-emerald-500" icon={<Calendar size={16} />} />
        <Column title="Completed" items={completed} color="text-brand-muted" icon={<CheckCircle2 size={16} />} />
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Reminder">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1">Customer *</label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
              className={inputClass}
            >
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g. Follow up on proposal"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional details..."
              rows={3}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className={inputClass}
              >
                <option value="follow_up">Follow-up</option>
                <option value="meeting">Meeting</option>
                <option value="task">Task</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-2 border border-border text-brand-muted rounded-lg hover:bg-brand-accent/5 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors text-sm font-medium"
            >
              Create Reminder
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Reminders;
