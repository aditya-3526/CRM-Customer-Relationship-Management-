import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Customer } from "../../types";
import { API_ENDPOINTS } from "../../config/api";
import { Modal } from "../../components/Modal";
import { AddCustomerForm } from "../../components/AddCustomerForm";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Download, Plus, Search, MoreVertical, Edit, Trash2, Eye } from "lucide-react";

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Pagination
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [editStatus, setEditStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.customers);
        setCustomers(response.data.data);
      } catch (err: any) {
        setError(err.message);
        toast.error("Failed to load customers.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Client-side pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await axios.delete(`${API_ENDPOINTS.customers}/${id}`);
      setCustomers(customers.filter(customer => customer._id !== id));
      toast.success("Customer deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete customer");
    }
  };

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers([newCustomer, ...customers]);
    toast.success("Customer added successfully!");
    setShowAddModal(false);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditStatus(customer.status);
    setShowDetailsModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    try {
      const response = await axios.put(`${API_ENDPOINTS.customers}/${selectedCustomer._id}`, {
        ...selectedCustomer,
        status: editStatus,
      });
      setCustomers(
        customers.map((c) =>
          c._id === selectedCustomer._id ? response.data.data : c
        )
      );
      toast.success("Customer updated successfully");
      setShowDetailsModal(false);
    } catch (err: any) {
      toast.error("Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Industry', 'Location', 'Status', 'Value'];
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(c => 
        [c.name, c.email, c.phone || '', c.industry || '', c.location || '', c.status, c.value].map(val => `"${val}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Exported to CSV successfully!');
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
      className="space-y-6"
    >
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-brand-dark tracking-tight">Customers</h1>
          <p className="text-brand-muted mt-1">Manage your clients and track their status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-surface border border-border text-brand-dark px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:bg-brand-accent/5 transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Controls Area (Search & Filters) */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-brand-dark placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
          />
        </div>
        
        <div className="flex bg-background p-1 rounded-xl w-full md:w-auto overflow-x-auto hide-scrollbar">
          {["All", "Active", "Pending", "Inactive"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filterStatus === status
                  ? "bg-surface text-brand-dark shadow-sm"
                  : "text-brand-muted hover:text-brand-dark"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-background/50 border-b border-border">
                <th className="py-4 px-6 text-xs font-semibold text-brand-muted uppercase tracking-wider">Customer Info</th>
                <th className="py-4 px-6 text-xs font-semibold text-brand-muted uppercase tracking-wider">Industry & Location</th>
                <th className="py-4 px-6 text-xs font-semibold text-brand-muted uppercase tracking-wider text-right">Value</th>
                <th className="py-4 px-6 text-xs font-semibold text-brand-muted uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-brand-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={customer._id} 
                    className="hover:bg-brand-accent/5 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-heading font-bold uppercase shrink-0">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p 
                            onClick={() => navigate(`/customers/${customer._id}`)}
                            className="text-sm font-medium text-brand-dark truncate hover:text-brand-accent cursor-pointer transition-colors"
                          >{customer.name}</p>
                          <p className="text-xs text-brand-muted truncate">{customer.email}</p>
                          {customer.phone && <p className="text-xs text-brand-muted truncate mt-0.5">{customer.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-brand-dark">{customer.industry || '—'}</span>
                        <span className="text-xs text-brand-muted">{customer.location || '—'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-brand-dark">
                      ${customer.value.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          customer.status === "Active"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200/50"
                            : customer.status === "Pending"
                            ? "bg-amber-100 text-amber-700 border border-amber-200/50"
                            : "bg-red-100 text-red-700 border border-red-200/50"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleViewDetails(customer)}
                          className="p-1.5 text-gray-400 hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="text-gray-400" size={24} />
                      </div>
                      <p className="text-base font-medium text-gray-900">No customers found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between text-sm">
            <span className="text-brand-muted">
              Showing <span className="font-medium text-brand-dark">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-brand-dark">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-medium text-brand-dark">{filteredCustomers.length}</span> results
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-border rounded-lg text-brand-dark hover:bg-brand-accent/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="px-4 py-1.5 font-medium text-brand-dark">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-border rounded-lg text-brand-dark hover:bg-brand-accent/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Customer"
      >
        <AddCustomerForm
          onClose={() => setShowAddModal(false)}
          onCustomerAdded={handleCustomerAdded}
        />
      </Modal>

      {/* Customer Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Customer Details"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-4">
              <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent text-2xl font-bold uppercase">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-brand-dark">{selectedCustomer.name}</h3>
                <p className="text-sm text-brand-muted">{selectedCustomer.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">Phone</span>
                <span className="text-sm text-brand-dark">{selectedCustomer.phone || '—'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">Value</span>
                <span className="text-sm font-semibold text-emerald-500">${selectedCustomer.value.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">Industry</span>
                <span className="text-sm text-brand-dark">{selectedCustomer.industry || '—'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">Location</span>
                <span className="text-sm text-brand-dark">{selectedCustomer.location || '—'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">Created</span>
                <span className="text-sm text-brand-dark">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1">Status</span>
                <select
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm text-brand-dark bg-background focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent outline-none transition-all"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Customers;