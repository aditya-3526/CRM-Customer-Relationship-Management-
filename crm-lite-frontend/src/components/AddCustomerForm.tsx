import React, { useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { Customer } from '../types';

interface AddCustomerFormProps {
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
}

export const AddCustomerForm: React.FC<AddCustomerFormProps> = ({ onClose, onCustomerAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    industry: '',
    location: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Pending',
    value: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(API_ENDPOINTS.customers, formData);
      onCustomerAdded(response.data.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-border rounded-md text-brand-dark bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Email *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-border rounded-md text-brand-dark bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Phone
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-border rounded-md text-brand-dark bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Industry
        </label>
        <input
          type="text"
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-border rounded-md text-brand-dark bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Location
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-border rounded-md text-brand-dark bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-border rounded-md text-brand-dark bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-muted mb-1">
          Value ($) *
        </label>
        <input
          type="number"
          name="value"
          value={formData.value}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
          className="w-full px-3 py-2 border border-border rounded-md text-brand-dark bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Customer'}
        </button>
      </div>
    </form>
  );
}; 