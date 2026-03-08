import React from 'react';
import { Customer } from '../../types';
import { Building2, DollarSign } from 'lucide-react';

interface CustomerCardProps {
  customer: Customer;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900 line-clamp-1">{customer.name}</h4>
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
          customer.status === 'Active' ? 'bg-emerald-500' : 
          customer.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
        }`} />
      </div>
      
      <div className="flex items-center text-xs text-gray-500 mb-3 gap-1.5">
        <Building2 size={13} />
        <span className="truncate">{customer.industry || 'Unknown Industry'}</span>
      </div>

      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex items-center font-semibold text-brand-dark text-sm">
          <DollarSign size={14} className="text-gray-400 mr-0.5" />
          {customer.value.toLocaleString()}
        </div>
        <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold border border-brand-primary/20">
          {customer.name.charAt(0)}
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;
