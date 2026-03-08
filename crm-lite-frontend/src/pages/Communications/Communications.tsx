import React, { useState, useEffect } from "react";
import axios from "axios";
import { Communication } from "../../types";
import { API_ENDPOINTS } from "../../config/api";
import { Modal } from "../../components/Modal";
import { AddCommunicationForm } from "../../components/AddCommunicationForm";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Plus, Search, Calendar, Phone, Mail, Video, Users as MeetingIcon, MoreVertical, Edit, Trash2, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { format, parseISO } from "date-fns";

const Communications = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editPriority, setEditPriority] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.communications, {
          params: {
            populate: "customerId",
            select: "name",
            sort: "-date"
          }
        });
        setCommunications(response.data.data);
      } catch (err: any) {
        setError(err.message);
        toast.error("Failed to load communications");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunications();
  }, []);

  const filteredComms = communications.filter((c) => {
    const matchesStatus = filter === "All" || c.status === filter;
    const matchesSearch = c.notes?.toLowerCase().includes(search.toLowerCase()) || 
                          c.customerId?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await axios.delete(`${API_ENDPOINTS.communications}/${id}`);
      setCommunications(communications.filter(comm => comm._id !== id));
      toast.success("Log deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete log");
    }
  };

  const handleCommunicationAdded = (newCommunication: Communication) => {
    setCommunications([newCommunication, ...communications].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    toast.success("Communication added");
    setShowAddModal(false);
  };

  const handleViewDetails = (comm: Communication) => {
    setSelectedComm(comm);
    setEditPriority(comm.priority);
    setEditNotes(comm.notes);
    setShowDetailsModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedComm) return;
    setSaving(true);
    try {
      const response = await axios.put(`${API_ENDPOINTS.communications}/${selectedComm._id}`, {
        ...selectedComm,
        priority: editPriority,
        notes: editNotes,
      });
      setCommunications(
        communications.map((c) =>
          c._id === selectedComm._id ? response.data.data : c
        )
      );
      toast.success("Communication updated");
      setShowDetailsModal(false);
    } catch (err: any) {
      toast.error("Failed to update communication");
    } finally {
      setSaving(false);
    }
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'Email': return <Mail size={18} className="text-blue-500" />;
      case 'Phone': return <Phone size={18} className="text-emerald-500" />;
      case 'Video Call': return <Video size={18} className="text-purple-500" />;
      case 'Meeting': return <MeetingIcon size={18} className="text-amber-500" />;
      default: return <MessageSquare size={18} className="text-gray-500" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch(type) {
      case 'Email': return "bg-blue-100 border-blue-200";
      case 'Phone': return "bg-emerald-100 border-emerald-200";
      case 'Video Call': return "bg-purple-100 border-purple-200";
      case 'Meeting': return "bg-amber-100 border-amber-200";
      default: return "bg-gray-100 border-gray-200";
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
    </div>
  );
  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-200">Error: {error}</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-brand-dark tracking-tight">Activity Log</h1>
          <p className="text-brand-muted mt-1">Timeline of all customer interactions and updates.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Log Activity
        </button>
      </div>

      <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sticky top-24 z-20">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
          <input
            type="text"
            placeholder="Search notes or customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-brand-dark placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
          />
        </div>
        
        <div className="flex bg-background p-1 rounded-xl w-full md:w-auto overflow-x-auto hide-scrollbar">
          {["All", "Completed", "Scheduled", "Pending"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter === status
                  ? "bg-surface text-brand-dark shadow-sm"
                  : "text-brand-muted hover:text-brand-dark"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline View */}
      <div className="relative pl-4 md:pl-8 ml-4 border-l-2 border-border space-y-8 mt-8">
        {filteredComms.length > 0 ? (
          filteredComms.map((comm, i) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={comm._id}
              className="relative"
            >
              {/* Timeline Marker */}
              <div className={`absolute -left-[35px] md:-left-[51px] w-10 h-10 rounded-full border-4 border-background flex items-center justify-center shadow-sm ${getTypeBg(comm.type)}`}>
                {getIconForType(comm.type)}
              </div>

              {/* Timeline Card */}
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow group">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-brand-accent">{comm.type}</span>
                      <span className="text-brand-muted">•</span>
                      <span className="text-sm text-brand-muted font-medium">with</span>
                      <span className="text-sm font-bold text-brand-dark">{comm.customerId?.name || "Unknown"}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-brand-muted mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {format(parseISO(comm.date), 'MMM d, yyyy')}
                      </div>
                      <span className="w-1 h-1 rounded-full bg-brand-muted/50"></span>
                      <div className="flex items-center gap-1">
                        {comm.status === 'Completed' ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Clock size={14} className="text-amber-500"/>}
                        <span className={comm.status === 'Completed' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                          {comm.status}
                        </span>
                      </div>
                      <span className="w-1 h-1 rounded-full bg-brand-muted/50"></span>
                      <span className={`font-medium ${comm.priority === 'High' ? 'text-red-500' : comm.priority === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {comm.priority} Priority
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleViewDetails(comm)}
                      className="p-2 text-gray-400 hover:text-brand-accent hover:bg-brand-accent/10 rounded-xl transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(comm._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {comm.notes && (
                  <div className="mt-4 p-4 bg-background rounded-xl border border-border text-sm text-brand-dark leading-relaxed">
                    {comm.notes}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-12 text-center text-brand-muted ml-[-2rem]">
            No communications found.
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Log Activity">
        <AddCommunicationForm onClose={() => setShowAddModal(false)} onCommunicationAdded={handleCommunicationAdded} />
      </Modal>

      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Edit Activity">
        {selectedComm && (
          <div className="space-y-5">
            <div className="bg-background p-4 rounded-xl space-y-2 text-sm border border-border">
              <div className="flex justify-between">
                <span className="text-brand-muted">Customer</span>
                <span className="font-semibold text-brand-dark">{selectedComm.customerId?.name || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Date</span>
                <span className="font-medium text-brand-dark">{format(parseISO(selectedComm.date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Type</span>
                <span className="font-medium text-brand-dark">{selectedComm.type}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Priority</label>
                <select
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-brand-dark bg-background focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent outline-none transition-all"
                  value={editPriority}
                  onChange={e => setEditPriority(e.target.value)}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Notes</label>
                <textarea
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm text-brand-dark bg-background focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent outline-none transition-all min-h-[120px]"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Add notes about this interaction..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                className="px-4 py-2 text-sm font-medium text-brand-muted hover:bg-brand-accent/5 rounded-xl transition-colors"
                onClick={() => setShowDetailsModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-brand-accent text-white px-5 py-2 rounded-xl text-sm font-medium shadow-md shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Communications;