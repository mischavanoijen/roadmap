import React, { useState } from 'react';
import { DEFAULT_CATEGORIES } from '../../types/roadmap';
import { Quarter, RoadmapItem } from '../../types/roadmap';
import { Users, Tags, Link2, FileText } from 'lucide-react';

type FormState = Omit<RoadmapItem, 'id'>;

export const initialFormState: FormState = {
  title: '',
  description: '',
  quarter: 'Q1',
  category: 'OPERATIONS',
  status: 'planned' as const,
  priority: 'medium' as const,
  assignees: [],
  dependencies: [],
  startDate: new Date(),
  endDate: new Date(),
  progress: 0,
  notes: '',
  tags: [],
  isMilestone: false,
};

export function FormFields() {
  const [formData, setFormData] = useState<FormState>(initialFormState);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {DEFAULT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Quarter</label>
        <select
          value={formData.quarter}
          onChange={(e) => setFormData({ ...formData, quarter: e.target.value as Quarter })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="Q1">Q1</option>
          <option value="Q2">Q2</option>
          <option value="Q3">Q3</option>
          <option value="Q4">Q4</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'planned' | 'in-progress' | 'completed' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="planned">Planned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Priority</label>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Progress</label>
        <input
          type="number"
          min="0"
          max="100"
          value={formData.progress || 0}
          onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Assignees</span>
          </div>
        </label>
        <input
          type="text"
          value={formData.assignees?.join(', ') || ''}
          onChange={(e) => setFormData({ ...formData, assignees: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="Enter assignees separated by commas"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span>Dependencies</span>
          </div>
        </label>
        <input
          type="text"
          value={formData.dependencies?.join(', ') || ''}
          onChange={(e) => setFormData({ ...formData, dependencies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="Enter dependencies separated by commas"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center gap-2">
            <Tags className="w-4 h-4" />
            <span>Tags</span>
          </div>
        </label>
        <input
          type="text"
          value={formData.tags?.join(', ') || ''}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="Enter tags separated by commas"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Notes</span>
          </div>
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isMilestone || false}
          onChange={(e) => setFormData({ ...formData, isMilestone: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="text-sm font-medium text-gray-700">Is Milestone</label>
      </div>
    </div>
  );
}