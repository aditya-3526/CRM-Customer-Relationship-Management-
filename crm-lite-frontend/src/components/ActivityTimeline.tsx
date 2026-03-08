import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { Communication } from '../types';
import { Mail, Phone, Video, Users as MeetingIcon, Calendar, CheckCircle2, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

interface ActivityTimelineProps {
  customerId: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ customerId }) => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchComms = async () => {
      try {
        const res = await axios.get(`${API_ENDPOINTS.communications}?customerId=${customerId}`);
        setCommunications(res.data.data);
      } catch (err) {
        console.error('Failed to fetch communications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComms();
  }, [customerId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Email': return <Mail size={16} className="text-blue-500" />;
      case 'Phone': return <Phone size={16} className="text-emerald-500" />;
      case 'Video Call': return <Video size={16} className="text-purple-500" />;
      case 'Meeting': return <MeetingIcon size={16} className="text-amber-500" />;
      default: return <MessageSquare size={16} className="text-brand-muted" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'Email': return 'bg-blue-500/20 border-blue-500/30';
      case 'Phone': return 'bg-emerald-500/20 border-emerald-500/30';
      case 'Video Call': return 'bg-purple-500/20 border-purple-500/30';
      case 'Meeting': return 'bg-amber-500/20 border-amber-500/30';
      default: return 'bg-brand-muted/20 border-border';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (communications.length === 0) {
    return (
      <div className="py-12 text-center">
        <MessageSquare size={40} className="mx-auto text-brand-muted/40 mb-3" />
        <p className="text-brand-muted text-sm">No interactions recorded yet.</p>
        <p className="text-brand-muted/60 text-xs mt-1">Communications will appear here once logged.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 ml-3 border-l-2 border-border space-y-6">
      {communications.map((comm, i) => (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          key={comm._id}
          className="relative"
        >
          {/* Marker */}
          <div className={`absolute -left-[29px] w-8 h-8 rounded-full border-2 border-background flex items-center justify-center ${getTypeBg(comm.type)}`}>
            {getIcon(comm.type)}
          </div>

          {/* Card */}
          <div
            className="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setExpandedId(expandedId === comm._id ? null : comm._id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-accent">{comm.type}</span>
                <span className="text-brand-muted text-xs">•</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  comm.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-500' :
                  comm.status === 'Scheduled' ? 'bg-amber-500/15 text-amber-500' :
                  'bg-red-500/15 text-red-500'
                }`}>
                  {comm.status}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  comm.priority === 'High' ? 'bg-red-500/15 text-red-500' :
                  comm.priority === 'Medium' ? 'bg-amber-500/15 text-amber-500' :
                  'bg-emerald-500/15 text-emerald-500'
                }`}>
                  {comm.priority}
                </span>
              </div>
              <div className="flex items-center gap-2 text-brand-muted">
                <Calendar size={12} />
                <span className="text-xs">{format(parseISO(comm.date), 'MMM d, yyyy')}</span>
                {expandedId === comm._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            {expandedId === comm._id && comm.notes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-3 pt-3 border-t border-border text-sm text-brand-dark leading-relaxed"
              >
                {comm.notes}
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
