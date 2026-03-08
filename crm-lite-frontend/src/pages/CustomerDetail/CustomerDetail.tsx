import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { Customer, Communication } from '../../types';
import { ActivityTimeline } from '../../components/ActivityTimeline';
import { CustomerInsights } from '../../components/CustomerInsights';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, DollarSign,
  Calendar, MessageSquare, TrendingUp, Edit, Save, X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'notes'>('overview');
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, commRes] = await Promise.all([
          axios.get(`${API_ENDPOINTS.customers}/${id}`),
          axios.get(`${API_ENDPOINTS.communications}?customerId=${id}`),
        ]);
        setCustomer(custRes.data.data);
        setCommunications(commRes.data.data);
      } catch (err: any) {
        toast.error('Failed to load customer details');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, navigate]);

  const handleSaveNote = () => {
    if (notes.trim()) {
      setSavedNotes([...savedNotes, notes.trim()]);
      setNotes('');
      setEditingNotes(false);
      toast.success('Note saved');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!customer) return null;

  const lastContact = communications.length > 0 ? communications[0] : null;
  const totalComms = communications.length;

  const getStageColor = (stage?: string) => {
    switch (stage) {
      case 'Closed Won': return 'bg-emerald-500/15 text-emerald-500';
      case 'Negotiation': return 'bg-amber-500/15 text-amber-500';
      case 'Proposal': return 'bg-blue-500/15 text-blue-500';
      case 'Contacted': return 'bg-purple-500/15 text-purple-500';
      default: return 'bg-brand-muted/15 text-brand-muted';
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'notes', label: 'Notes' },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-accent transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Customers
      </button>

      {/* Header Card */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-accent/15 flex items-center justify-center text-brand-accent text-2xl font-bold uppercase">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-brand-dark">{customer.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm text-brand-muted">
                  <Mail size={14} /> {customer.email}
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1 text-sm text-brand-muted">
                    <Phone size={14} /> {customer.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              customer.status === 'Active' ? 'bg-emerald-500/15 text-emerald-500' :
              customer.status === 'Pending' ? 'bg-amber-500/15 text-amber-500' :
              'bg-red-500/15 text-red-500'
            }`}>
              {customer.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStageColor(customer.stage)}`}>
              {customer.stage || 'Lead'}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-brand-muted">Deal Value</p>
              <p className="text-lg font-bold text-brand-dark">${customer.value.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <MessageSquare size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-brand-muted">Interactions</p>
              <p className="text-lg font-bold text-brand-dark">{totalComms}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Calendar size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-brand-muted">Last Contact</p>
              <p className="text-sm font-semibold text-brand-dark">
                {lastContact ? format(parseISO(lastContact.date), 'MMM d, yyyy') : 'Never'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Building2 size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-brand-muted">Industry</p>
              <p className="text-sm font-semibold text-brand-dark">{customer.industry || 'General'}</p>
            </div>
          </div>
        </div>

        {customer.location && (
          <div className="flex items-center gap-1.5 mt-4 text-sm text-brand-muted">
            <MapPin size={14} />
            {customer.location}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
                activeTab === tab.key
                  ? 'text-brand-accent'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent"
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <CustomerInsights customerId={customer._id} />
              
              {/* Quick Info */}
              <div className="bg-background border border-border rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-brand-dark">Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Created</span>
                    <span className="text-brand-dark font-medium">{format(parseISO(customer.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Email</span>
                    <span className="text-brand-dark font-medium">{customer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Phone</span>
                    <span className="text-brand-dark font-medium">{customer.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Location</span>
                    <span className="text-brand-dark font-medium">{customer.location || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <ActivityTimeline customerId={customer._id} />
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-brand-dark">Notes</h4>
                {!editingNotes && (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="flex items-center gap-1 text-xs text-brand-accent hover:text-brand-accent/80 transition-colors"
                  >
                    <Edit size={12} /> Add Note
                  </button>
                )}
              </div>

              {editingNotes && (
                <div className="bg-background border border-border rounded-xl p-4 space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write a note about this customer..."
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-brand-dark placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/50 min-h-[100px] resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setEditingNotes(false); setNotes(''); }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-brand-muted hover:text-brand-dark border border-border rounded-lg transition-colors"
                    >
                      <X size={12} /> Cancel
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-brand-accent rounded-lg hover:bg-brand-accent/90 transition-colors"
                    >
                      <Save size={12} /> Save
                    </button>
                  </div>
                </div>
              )}

              {savedNotes.length > 0 ? (
                <div className="space-y-3">
                  {savedNotes.map((note, i) => (
                    <div key={i} className="bg-background border border-border rounded-xl p-4 text-sm text-brand-dark leading-relaxed">
                      <p className="text-xs text-brand-muted mb-2">{format(new Date(), 'MMM d, yyyy')}</p>
                      {note}
                    </div>
                  ))}
                </div>
              ) : (
                !editingNotes && (
                  <div className="py-8 text-center">
                    <Edit size={32} className="mx-auto text-brand-muted/40 mb-2" />
                    <p className="text-sm text-brand-muted">No notes yet. Click "Add Note" to get started.</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerDetail;
