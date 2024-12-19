import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RoadmapItem } from '../../types/roadmap';
import { AlertCircle, CheckCircle2, Clock, Users, Tags, Link2, Star } from 'lucide-react';
import clsx from 'clsx';

interface RoadmapCardProps {
  item: RoadmapItem;
  isDragging?: boolean;
}

const statusIcons = {
  planned: Clock,
  'in-progress': AlertCircle,
  completed: CheckCircle2,
};

const statusColors = {
  planned: 'text-blue-600',
  'in-progress': 'text-amber-500',
  completed: 'text-emerald-500',
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-rose-100 text-rose-800 border-rose-200',
};

const categoryColors = {
  OPERATIONS: 'border-l-emerald-400',
  'LOAD REDUCTION': 'border-l-yellow-400',
  'SERVICE QUALITY': 'border-l-red-400',
  SECURITY: 'border-l-indigo-700',
  MILESTONES: 'border-l-teal-600',
};

export function RoadmapCard({ item, isDragging }: RoadmapCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableItemDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const StatusIcon = statusIcons[item.status];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-white rounded-lg shadow-sm border-l-4',
        categoryColors[item.category],
        'cursor-move hover:shadow-md transition-all duration-200',
        'active:shadow-lg active:scale-[1.02]',
        (isDragging || isSortableItemDragging) && 'opacity-50',
        'touch-manipulation'
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {item.isMilestone && (
                <Star className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              )}
              <h4 className="font-semibold text-gray-900 truncate">
                {item.title}
              </h4>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {item.description}
            </p>
          </div>
          <StatusIcon 
            className={clsx(
              'w-5 h-5 flex-shrink-0',
              statusColors[item.status]
            )}
          />
        </div>

        {/* Progress bar */}
        {item.progress !== undefined && item.progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}

        {/* Meta information */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span
            className={clsx(
              'text-xs px-2 py-1 rounded-full font-medium border',
              priorityColors[item.priority]
            )}
          >
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </span>

          {item.assignees && item.assignees.length > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 mr-1" />
              <span className="truncate max-w-[100px]">
                {item.assignees.join(', ')}
              </span>
            </div>
          )}

          {item.dependencies && item.dependencies.length > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              <Link2 className="w-3.5 h-3.5 mr-1" />
              <span>{item.dependencies.length}</span>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              <Tags className="w-3.5 h-3.5 mr-1" />
              <span className="truncate max-w-[100px]">
                {item.tags.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Dates if available */}
        {(item.startDate || item.endDate) && (
          <div className="mt-2 text-xs text-gray-500">
            {item.startDate && (
              <span>
                {new Date(item.startDate).toLocaleDateString()} 
                {item.endDate && ' - '}
              </span>
            )}
            {item.endDate && (
              <span>{new Date(item.endDate).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}