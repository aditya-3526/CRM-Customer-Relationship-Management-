import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { Communication, Customer } from '../types';
import { Wand2 } from 'lucide-react';

interface AddCommunicationFormProps {
  onClose: () => void;
  onCommunicationAdded: (communication: Communication) => void;
}

export const AddCommunicationForm: React.FC<AddCommunicationFormProps> = ({ onClose, onCommunicationAdded }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    type: 'Email' as 'Email' | 'Phone' | 'Video Call' | 'Meeting',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    status: 'Pending' as 'Completed' | 'Scheduled' | 'Pending',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.customers);
        setCustomers(response.data.data);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDraftAI = async () => {
    if (!formData.customerId) {
        setError("Please select a customer first.");
        return;
    }
    setGeneratingAI(true);
    setError('');
    try {
        const res = await axios.post(API_ENDPOINTS.draftEmail, { // @ts-ignore mapping
            customerId: formData.customerId,
            context: formData.notes || "Just checking in.",
        });
        setFormData(prev => ({ ...prev, notes: res.data.data, type: 'Email' }));
    } catch (err: any) {
        setError(err.response?.data?.error || "Failed to generate AI draft.");
    } finally {
        setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.communications, formData);
      onCommunicationAdded(response.data.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add communication');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-border rounded-md bg-background text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Customer *
        </label>
        <select
          name="customerId"
          value={formData.customerId}
          onChange={handleChange}
          required
          className={inputClass}
        >
          <option value="">Select a customer</option>
          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.name} ({customer.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Type *
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className={inputClass}
        >
          <option value="Email">Email</option>
          <option value="Phone">Phone</option>
          <option value="Video Call">Video Call</option>
          <option value="Meeting">Meeting</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Priority
        </label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="Pending">Pending</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Date
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <div className="flex justify-between items-end mb-1">
          <label className="block text-sm font-medium text-brand-muted">
            Notes *
          </label>
          <button 
            type="button" 
            onClick={handleDraftAI}
            disabled={generatingAI || !formData.customerId}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-accent bg-brand-accent/10 hover:bg-brand-accent/20 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
          >
            <Wand2 size={12} />
            {generatingAI ? 'Drafting...' : 'Draft with AI'}
          </button>
        </div>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          required
          rows={4}
          className={inputClass}
          placeholder="Enter communication notes..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-border text-brand-muted rounded-md hover:bg-brand-accent/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-brand-accent text-white rounded-md hover:bg-brand-accent/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Communication'}
        </button>
      </div>
    </form>
  );
}; 