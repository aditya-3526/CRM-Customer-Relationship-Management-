import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Customer } from '../../types';
import SortableCustomerCard from './SortableCustomerCard';

interface ColumnProps {
  stage: string;
  customers: Customer[];
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'Lead': return 'border-blue-200 bg-blue-50/50';
    case 'Contacted': return 'border-indigo-200 bg-indigo-50/50';
    case 'Proposal': return 'border-purple-200 bg-purple-50/50';
    case 'Negotiation': return 'border-orange-200 bg-orange-50/50';
    case 'Closed Won': return 'border-emerald-200 bg-emerald-50/50';
    default: return 'border-gray-200 bg-gray-50/50';
  }
};

const Column: React.FC<ColumnProps> = ({ stage, customers }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage, // The stage name acts as the container id
  });

  return (
    <div className="flex flex-col w-80 flex-shrink-0 h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-heading font-semibold text-gray-800 uppercase tracking-wider text-sm">{stage}</h3>
        <span className="text-xs font-bold bg-white shadow-sm border border-gray-100 text-gray-500 w-6 h-6 rounded-full flex items-center justify-center">
          {customers.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className={`flex-1 rounded-2xl p-3 border overflow-y-auto transition-colors ${getStageColor(stage)} ${isOver ? 'ring-2 ring-brand-accent/50 bg-brand-accent/5' : ''}`}
      >
        <SortableContext
          id={stage}
          items={customers.map(c => c._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3 min-h-[100px]">
            {customers.map(customer => (
              <SortableCustomerCard key={customer._id} customer={customer} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default Column;
