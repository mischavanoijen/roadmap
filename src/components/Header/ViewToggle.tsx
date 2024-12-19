import React from 'react';
import { LayoutGrid, Clock } from 'lucide-react';
import clsx from 'clsx';
import { View } from '../../types/roadmap';

interface ViewToggleProps {
  view: View;
  onViewChange: (view: View) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => onViewChange('kanban')}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
          view === 'kanban'
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        )}
      >
        <LayoutGrid className="w-5 h-5" />
        Kanban
      </button>
      <button
        onClick={() => onViewChange('timeline')}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
          view === 'timeline'
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        )}
      >
        <Clock className="w-5 h-5" />
        Timeline
      </button>
    </div>
  );
}