import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRoadmapStore } from '../../store/roadmapStore';
import { Quarter, RoadmapItem } from '../../types/roadmap';
import { FormFields } from './FormFields';

const initialFormState: Omit<RoadmapItem, 'id'> = {
  title: '',
  description: '',
  quarter: 'Q1' as Quarter,
  category: 'OPERATIONS',
  status: 'planned',
  priority: 'medium',
  progress: 0,
  assignees: [],
  dependencies: [],
  tags: [],
  isMilestone: false,
};

export function AddItemForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const addItem = useRoadmapStore((state) => state.addItem);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addItem(formData);
    setFormData(initialFormState);
    setIsOpen(false);
  };

  const handleChange = (field: keyof RoadmapItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Roadmap Item
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Add New Roadmap Item</h2>
        <p className="text-sm text-gray-500">Fill in the details for the new roadmap item.</p>
      </div>

      <FormFields formData={formData} onChange={handleChange} />

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Item
        </button>
      </div>
    </form>
  );
}