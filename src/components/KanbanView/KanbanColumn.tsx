import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { RoadmapCard } from '../RoadmapCard/RoadmapCard';
import { Quarter, RoadmapItem } from '../../types/roadmap';
import clsx from 'clsx';

interface KanbanColumnProps {
  quarter: Quarter;
  items: RoadmapItem[];
}

export function KanbanColumn({ quarter, items }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: quarter,
    data: {
      type: 'column',
      quarter,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={clsx(
        'bg-gray-50 rounded-lg p-4 transition-colors min-h-[200px]',
        isOver && 'bg-gray-100 ring-2 ring-blue-500 ring-opacity-50'
      )}
    >
      <h2 className="text-lg font-semibold mb-4">{quarter}</h2>
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {items.map((item) => (
            <RoadmapCard key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}