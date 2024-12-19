import React from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { useRoadmapStore } from '../../store/roadmapStore';
import { QUARTERS } from '../../utils/constants';
import { RoadmapCard } from '../RoadmapCard/RoadmapCard';
import type { Quarter } from '../../types/roadmap';

export function KanbanView() {
  const { items, moveItem } = useRoadmapStore();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const itemId = active.id as string;
    const toQuarter = over.id as Quarter;

    if (QUARTERS.includes(toQuarter)) {
      moveItem(itemId, toQuarter);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId ? items.find(item => item.id === activeId) : null;

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {QUARTERS.map((quarter) => (
          <KanbanColumn
            key={quarter}
            quarter={quarter}
            items={items.filter((item) => item.quarter === quarter)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="w-[calc(100%-2rem)]">
            <RoadmapCard item={activeItem} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}