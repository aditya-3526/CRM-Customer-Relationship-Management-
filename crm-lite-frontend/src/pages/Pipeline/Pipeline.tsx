import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api';
import { Customer } from '../../types';
import Column from './Column';
import CustomerCard from './CustomerCard';

export const STAGES = ['Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed Won'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const Pipeline = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.customers as string); // API config might not have typescript mapping correctly if it's string, we'll cast
      setCustomers(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const customer = customers.find(c => c._id === active.id);
    if (customer) setActiveCustomer(customer);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine the containers
    const activeStage = active.data.current?.sortable?.containerId;
    const overStage = over.data.current?.sortable?.containerId || over.id;

    if (!activeStage || !overStage || activeStage === overStage) return;

    setCustomers((prev) => {
      const activeItems = prev.filter(c => c.stage === activeStage);
      const overItems = prev.filter(c => c.stage === overStage);
      
      const activeIndex = activeItems.findIndex(c => c._id === activeId);
      const overIndex = overItems.findIndex(c => c._id === overId);

      const newCustomers = [...prev];
      const customerToMoveIndex = newCustomers.findIndex(c => c._id === activeId);
      
      if (customerToMoveIndex > -1) {
         newCustomers[customerToMoveIndex] = {
           ...newCustomers[customerToMoveIndex],
           stage: overStage as string
         };
      }
      return newCustomers;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCustomer(null);
    const { active, over } = event;
    
    if (!over) return;

    const customerId = active.id as string;
    const overStage = over.data.current?.sortable?.containerId || over.id;
    
    const customer = customers.find(c => c._id === customerId);
    
    if (customer && customer.stage === overStage) {
      // It's in the same container, do a simple sort operation if we wanted to 
      // but for simplicity, we don't persist order in db yet, just stage updates.
      return;
    }

    if (customer && customer.stage !== overStage && STAGES.includes(overStage as string)) {
      try {
        await axios.put(`${API_ENDPOINTS.customers as string}/${customerId}`, { stage: overStage });
        toast.success(`Moved to ${overStage}`);
      } catch (error: any) {
        toast.error('Failed to move customer');
        fetchCustomers(); // Revert on failure
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-heading font-bold text-brand-dark tracking-tight">Sales Pipeline</h1>
        <p className="text-gray-500 mt-1">Drag and drop customers to update their current stage.</p>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full min-w-max px-1">
            {STAGES.map((stage) => (
              <Column 
                key={stage} 
                stage={stage} 
                customers={customers.filter(c => c.stage === stage || (!c.stage && stage === 'Lead'))} 
              />
            ))}
          </div>

          <DragOverlay>
            {activeCustomer ? (
              <div className="rotate-3 scale-105 opacity-80 cursor-grabbing">
                <CustomerCard customer={activeCustomer} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </motion.div>
  );
};

export default Pipeline;
