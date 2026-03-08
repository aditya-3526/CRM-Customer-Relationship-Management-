import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Customer } from '../../types';
import CustomerCard from './CustomerCard';

interface SortableCustomerCardProps {
  customer: Customer;
}

const SortableCustomerCard: React.FC<SortableCustomerCardProps> = ({ customer }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: customer._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform`}
    >
      <CustomerCard customer={customer} />
    </div>
  );
};

export default SortableCustomerCard;
