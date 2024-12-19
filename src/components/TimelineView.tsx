import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  useDroppable,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { useRoadmapStore } from '../store/roadmapStore';
import { Quarter, RoadmapItem } from '../types/roadmap';

const YEAR = 2025;

const quarterDates = [
  { quarter: 'Q1', startDate: new Date(YEAR, 0, 1), endDate: new Date(YEAR, 2, 31) },
  { quarter: 'Q2', startDate: new Date(YEAR, 3, 1), endDate: new Date(YEAR, 5, 30) },
  { quarter: 'Q3', startDate: new Date(YEAR, 6, 1), endDate: new Date(YEAR, 8, 30) },
  { quarter: 'Q4', startDate: new Date(YEAR, 9, 1), endDate: new Date(YEAR, 11, 31) },
] as const;

interface TimelineItemProps {
  item: RoadmapItem;
  category: string;
  isDragging?: boolean;
}

function DescriptionModal({ 
  isOpen, 
  onClose, 
  initialDescription,
  itemTitle,
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  initialDescription: string;
  itemTitle: string;
  onSave: (description: string) => void;
}) {
  const [description, setDescription] = useState(initialDescription);
  const [isRewriting, setIsRewriting] = useState(false);

  const handleSave = () => {
    onSave(description);
    onClose();
  };

  const rewriteDescription = async () => {
    setIsRewriting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_AZURE_OPENAI_ENDPOINT}/openai/deployments/${
        import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME
      }/chat/completions?api-version=2023-05-15`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': import.meta.env.VITE_AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert in writing enterprise software feature descriptions that focus on business value and user benefits. Your task is to create clear, impactful descriptions that:

1. Highlight the direct benefits and value for end users
2. Explain how the feature solves specific business problems
3. Include relevant use cases or examples
4. Emphasize efficiency gains and cost savings
5. Use clear, non-technical language
6. Keep the tone professional but engaging
7. Be concise yet comprehensive (2-3 sentences)`
            },
            {
              role: 'user',
              content: description.trim() 
                ? `Please enhance this feature description to be more user-centric and value-focused.\n\nFeature: "${itemTitle}"\nCurrent description: "${description}"`
                : `Please create a user-centric feature description that highlights the business value and benefits.\n\nFeature: "${itemTitle}"\n\nFocus on how this feature benefits users and solves business problems.`
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rewrite description');
      }

      const data = await response.json();
      setDescription(data.choices[0].message.content.trim());
    } catch (error) {
      console.error('Error rewriting description:', error);
      alert('Failed to rewrite description. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Edit Description</h2>
          <p className="text-sm text-slate-400 mb-4">for "{itemTitle}"</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-40 px-3 py-2 bg-slate-700 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a description..."
          />
        </div>
        <div className="border-t border-slate-700 p-4 flex justify-between gap-3 bg-slate-800">
          <button
            onClick={rewriteDescription}
            disabled={isRewriting}
            className={clsx(
              "px-4 py-2 rounded-md transition-colors",
              isRewriting
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-500 text-white"
            )}
          >
            {isRewriting ? 'Rewriting...' : description.trim() ? 'Enhance Description' : 'Generate Description'}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ 
  item, 
  category,
  isDragging = false,
  onModalOpen,
  onModalClose
}: TimelineItemProps & { 
  isDragging?: boolean;
  onModalOpen: () => void;
  onModalClose: () => void;
}) {
  const { updateItem } = useRoadmapStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const categorySettings = useRoadmapStore((state) => state.categorySettings[category]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleModalOpen = () => {
    setIsModalOpen(true);
    onModalOpen();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    onModalClose();
  };

  const handleBlur = () => {
    if (title.trim()) {
      updateItem(item.id, { title });
      setIsEditing(false);
    } else {
      setTitle(item.title);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleBlur();
    } else if (e.key === 'Escape') {
      setTitle(item.title);
      setIsEditing(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      handleModalOpen();
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveDescription = (description: string) => {
    updateItem(item.id, { description });
    handleModalClose();
  };

  return (
    <>
      <div
        onDoubleClick={handleDoubleClick}
        className={clsx(
          'p-3 rounded-lg shadow-sm mb-2 cursor-grab relative group',
          'bg-slate-900 border border-slate-700',
          isDragging && 'shadow-lg ring-2 ring-slate-400'
        )}
      >
        <div className={clsx(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg',
          categorySettings.color
        )} />
        <div className="ml-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full px-1 py-0.5 bg-slate-700/50 border-b border-slate-500 text-slate-100 placeholder-slate-400 focus:outline-none rounded"
              placeholder="Enter title..."
            />
          ) : (
            <div className="text-sm font-medium text-slate-100">{title}</div>
          )}
        </div>
        {item.description && (
          <div className="absolute invisible group-hover:visible w-80 p-4 bg-slate-800 text-slate-100 rounded-lg shadow-lg -translate-y-full -translate-x-1/4 top-0 left-0 z-10 text-sm">
            {item.description}
          </div>
        )}
      </div>
      <DescriptionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialDescription={item.description || ''}
        itemTitle={item.title}
        onSave={handleSaveDescription}
      />
    </>
  );
}

function DraggableTimelineItem({ 
  item, 
  category,
  onModalOpen,
  onModalClose,
  isDescriptionModalOpen
}: TimelineItemProps & { 
  onModalOpen: () => void;
  onModalClose: () => void;
  isDescriptionModalOpen: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      item,
      category,
      quarter: item.quarter,
    },
    disabled: isDescriptionModalOpen,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'relative',
        'mb-3',
        isDescriptionModalOpen ? 'cursor-default' : 'cursor-move',
        'transition-opacity duration-200',
        isDragging ? 'opacity-0' : 'opacity-100'
      )}
    >
      <TimelineItem 
        item={item} 
        category={category} 
        isDragging={isDragging} 
        onModalOpen={onModalOpen}
        onModalClose={onModalClose}
      />
    </div>
  );
}

function DraggableCategory({ 
  category, 
  children,
  isDescriptionModalOpen 
}: { 
  category: string; 
  children: React.ReactNode;
  isDescriptionModalOpen: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category,
    data: {
      type: 'category',
      category,
    },
    disabled: isDescriptionModalOpen,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-slate-900',
        isDragging ? 'opacity-50 z-50 shadow-lg' : 'opacity-100'
      )}
    >
      {children}
    </div>
  );
}

interface DropZoneProps {
  quarter: Quarter;
  category: string;
  items: RoadmapItem[];
  children: React.ReactNode;
}

function DropZone({ quarter, category, items, children }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${category}-${quarter}`,
    data: {
      quarter,
      category,
      type: 'zone',
    },
  });

  const { addEmptyItem, updateItem } = useRoadmapStore();

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const id = addEmptyItem();
      updateItem(id, {
        quarter,
        category,
        title: 'New Item',
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={handleDoubleClick}
      className={clsx(
        'relative transition-colors duration-200 p-2',
        isOver ? 'bg-slate-700/50 backdrop-blur-sm' : 'bg-slate-800',
        'cursor-pointer min-h-[3.5rem]'
      )}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </div>
  );
}

function CategoryName({ category, settings }: { category: string; settings: { name: string; color: string; textColor: string } }) {
  const { updateCategorySettings } = useRoadmapStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(settings.name);
  const [isColorPickerOpen, setIsColorPickerOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const colorPickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close color picker when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBlur = () => {
    if (name.trim()) {
      updateCategorySettings(category, { name });
      setIsEditing(false);
    } else {
      setName(settings.name);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleBlur();
    } else if (e.key === 'Escape') {
      setName(settings.name);
      setIsEditing(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setIsColorPickerOpen(false);
  };

  const handleColorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsColorPickerOpen(!isColorPickerOpen);
    setIsEditing(false);
  };

  const colors = [
    { bg: 'bg-indigo-400', text: 'text-black' },
    { bg: 'bg-purple-400', text: 'text-black' },
    { bg: 'bg-blue-400', text: 'text-black' },
    { bg: 'bg-emerald-400', text: 'text-black' },
    { bg: 'bg-rose-400', text: 'text-black' },
    { bg: 'bg-sky-400', text: 'text-black' },
    { bg: 'bg-violet-400', text: 'text-black' },
    { bg: 'bg-amber-400', text: 'text-black' },
    { bg: 'bg-teal-400', text: 'text-black' },
    { bg: 'bg-orange-400', text: 'text-black' },
    { bg: 'bg-cyan-400', text: 'text-black' },
    { bg: 'bg-fuchsia-400', text: 'text-black' },
    { bg: 'bg-pink-400', text: 'text-black' },
    { bg: 'bg-lime-400', text: 'text-black' },
    { bg: 'bg-green-400', text: 'text-black' },
  ];

  const colorClasses = {
    bg: settings.color,
    text: settings.textColor,
    hover: settings.color.replace('bg-', 'hover:bg-').replace('400', '300'),
  };

  return (
      <div className="relative">
      <div
        className={clsx(
          'px-4 py-2 rounded-md font-medium text-sm transition-all duration-200',
          'border border-slate-600',
          colorClasses.bg,
          colorClasses.text,
          !isEditing && colorClasses.hover,
          'flex items-center justify-between gap-2'
        )}
      >
        <div
          className="flex-1 cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={clsx(
                'w-full px-1 py-0.5 bg-slate-800/50 rounded border-none',
                'text-slate-100 placeholder-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500'
              )}
            />
          ) : (
            <span>{settings.name}</span>
          )}
        </div>
        <button
          onClick={handleColorClick}
          className={clsx(
            'w-5 h-5 rounded-full border-2 border-slate-400/50',
            'hover:border-slate-300 transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500',
            colorClasses.bg
          )}
        />
            </div>

      {/* Color picker dropdown */}
      {isColorPickerOpen && (
        <div
          ref={colorPickerRef}
          className={clsx(
            'absolute top-full left-0 mt-1 p-2 bg-slate-800 rounded-lg shadow-lg border border-slate-600',
            'grid grid-cols-5 gap-1 z-50'
          )}
        >
          {colors.map((color, index) => (
            <button
              key={index}
              onClick={() => {
                updateCategorySettings(category, { color: color.bg, textColor: color.text });
                setIsColorPickerOpen(false);
              }}
              className={clsx(
                'w-6 h-6 rounded-full',
                'hover:ring-2 hover:ring-offset-1 hover:ring-slate-400 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400',
                color.bg
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddCategoryButton() {
  const { addCategory } = useRoadmapStore();
  const [isAdding, setIsAdding] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = () => {
    if (newCategory.trim()) {
      const category = newCategory.toUpperCase().replace(/\s+/g, '_');
      console.log('Adding new category:', category);
      addCategory(category);
      setNewCategory('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewCategory('');
    }
  };

  return (
    <div className="flex w-full border-t border-slate-700 add-category-button">
      <div className="w-40 flex-shrink-0 pr-4 py-2">
        {isAdding ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newCategory.trim()) {
                  setIsAdding(false);
                } else {
                  handleAdd();
                }
              }}
              placeholder="Category name..."
              className="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full px-3 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors group"
          >
            <span className="text-lg leading-none group-hover:text-blue-400">+</span>
            <span className="group-hover:text-blue-400">Add Category</span>
          </button>
        )}
      </div>
      <div className="flex-1 grid grid-cols-4 gap-px bg-slate-700">
        {quarterDates.map(({ quarter }) => (
          <div key={quarter} className="bg-slate-800 min-h-[60px]" />
        ))}
      </div>
    </div>
  );
}

function DeleteDroppable() {
  const { setNodeRef: setLeftRef, isOver: isOverLeft } = useDroppable({
    id: 'delete-zone-left',
    data: { type: 'delete-zone' },
  });

  const { setNodeRef: setRightRef, isOver: isOverRight } = useDroppable({
    id: 'delete-zone-right',
    data: { type: 'delete-zone' },
  });

  return (
    <>
      {/* Left delete zone - outside left edge */}
      <div
        ref={setLeftRef}
        className={clsx(
          'fixed left-0 top-0 bottom-0 w-16 z-50 transition-colors duration-200',
          isOverLeft ? 'bg-red-900/50 backdrop-blur-sm' : 'bg-slate-800/30'
        )}
      >
        {isOverLeft && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-400 font-medium bg-slate-900 px-4 py-2 rounded-lg shadow-lg border border-red-800 rotate-90">
              Drop to delete
            </div>
          </div>
        )}
      </div>

      {/* Right delete zone - outside right edge */}
      <div
        ref={setRightRef}
                    className={clsx(
          'fixed right-0 top-0 bottom-0 w-16 z-50 transition-colors duration-200',
          isOverRight ? 'bg-red-900/50 backdrop-blur-sm' : 'bg-slate-800/30'
        )}
      >
        {isOverRight && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-400 font-medium bg-slate-900 px-4 py-2 rounded-lg shadow-lg border border-red-800 rotate-90">
              Drop to delete
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function TimelineView() {
  const { 
    items, 
    moveItem, 
    updateItem, 
    reorderItems, 
    categorySettings, 
    categoryOrder, 
    reorderCategories, 
    deleteItem, 
    deleteCategory 
  } = useRoadmapStore();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = React.useState(false);

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

  // Add debug logging
  React.useEffect(() => {
    console.log('TimelineView mounted');
    console.log('Items:', items);
    console.log('CategorySettings:', categorySettings);
  }, [items, categorySettings]);

  // Group items by category and quarter
  const itemsByCategory = React.useMemo(() => {
    try {
      if (!categorySettings || !categoryOrder) {
        console.warn('No category settings or order found');
        return [];
      }

      // Ensure we're using the category order from the store
      return categoryOrder.filter(category => categorySettings[category]).map(category => ({
        name: category,
        settings: categorySettings[category],
        items: items.filter(item => item.category === category)
      }));
    } catch (e) {
      console.error('Error in itemsByCategory:', e);
      setError(e as Error);
      return [];
    }
  }, [items, categorySettings, categoryOrder]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const draggedItem = items.find(item => item.id === active.id);
    setActiveId(null);

    // Check if the item was dropped in either delete zone
    if ((over?.id === 'delete-zone-left' || over?.id === 'delete-zone-right') && active.data.current?.type) {
      if (active.data.current.type === 'item' && draggedItem) {
        if (window.confirm(`Delete "${draggedItem.title}"?`)) {
          deleteItem(draggedItem.id);
          return;
        }
      } else if (active.data.current.type === 'category') {
        const category = active.id as string;
        const categoryName = categorySettings[category]?.name || category;
        if (categoryOrder.length <= 1) {
          alert("Cannot delete the last category");
          return;
        }
        if (window.confirm(`Delete category "${categoryName}"?\nAll items in this category will be moved to Operations.`)) {
          deleteCategory(category);
          return;
        }
      }
      return;
    }

    // If no valid drop target, return
    if (!over) return;

    // Handle category reordering
    if (active.data.current?.type === 'category') {
      const oldIndex = categoryOrder.indexOf(active.id as string);
      const newIndex = categoryOrder.indexOf(over.id as string);
      
      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
        console.log('Reordering categories:', { oldIndex, newIndex, active, over });
        const newOrder = arrayMove(categoryOrder, oldIndex, newIndex);
        reorderCategories(newOrder);
      }
      return;
    }

    // Handle item reordering and moving
    if (!draggedItem) return;

    if (over.data?.current?.type === 'item') {
      const overItem = items.find(item => item.id === over.id);
      if (!overItem) return;

      const isSameCategory = draggedItem.category === overItem.category;
      const isSameQuarter = draggedItem.quarter === overItem.quarter;

      if (isSameCategory && isSameQuarter) {
        const zoneItems = items.filter(
          item => item.category === overItem.category && item.quarter === overItem.quarter
        );
        const oldIndex = zoneItems.findIndex(item => item.id === active.id);
        const newIndex = zoneItems.findIndex(item => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(zoneItems, oldIndex, newIndex);
          reorderItems(overItem.category, overItem.quarter, newItems.map(item => item.id));
        }
      } else {
        if (draggedItem.category !== overItem.category) {
          updateItem(draggedItem.id, { category: overItem.category });
        }
        if (draggedItem.quarter !== overItem.quarter) {
          moveItem(draggedItem.id, overItem.quarter);
        }
      }
      return;
    }

    // If dropping on a zone
    const [targetCategory, targetQuarter] = (over.id as string).split('-');
    if (isValidCategory(targetCategory) && isValidQuarter(targetQuarter)) {
      const targetItems = items.filter(
        item => item.category === targetCategory && item.quarter === targetQuarter
      );

      if (draggedItem.quarter !== targetQuarter || draggedItem.category !== targetCategory) {
        moveItem(draggedItem.id, targetQuarter);
        if (draggedItem.category !== targetCategory) {
          updateItem(draggedItem.id, { category: targetCategory });
        }
        reorderItems(targetCategory, targetQuarter, [...targetItems.map(item => item.id), draggedItem.id]);
      }
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-900">
        <h2 className="text-lg font-bold">Error</h2>
        <pre className="mt-2 text-sm">{error.message}</pre>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-900 rounded"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 bg-slate-900">
        {activeId && <DeleteDroppable />}
        
        <div className="px-16">
          <div className="relative">
            {/* Timeline header */}
            <div className="flex mb-6">
              <div className="w-40 flex-shrink-0" />
              <div className="flex-1 grid grid-cols-4 gap-px bg-slate-700">
                {quarterDates.map(({ quarter }) => (
                  <div key={quarter} className="bg-slate-800 px-4 py-3">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-xl font-semibold text-slate-100">{quarter}</h3>
                      <span className="text-sm text-slate-400">
                        {format(quarter)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline content */}
            {itemsByCategory.length > 0 ? (
              <SortableContext
                items={categoryOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-px">
                  {itemsByCategory.map(({ name: category, settings, items: categoryItems }) => (
                    <DraggableCategory
                      key={category}
                      category={category}
                      isDescriptionModalOpen={isDescriptionModalOpen}
                    >
                      <div className="flex w-full">
                        <div className="w-40 flex-shrink-0 pr-4 py-2 cursor-move">
                          <CategoryName category={category} settings={settings} />
                        </div>

                        <div className="flex-1 grid grid-cols-4 gap-px bg-gray-200">
                          {quarterDates.map(({ quarter }) => {
                            const quarterItems = categoryItems.filter(item => item.quarter === quarter);
                            return (
                              <DropZone
                                key={quarter}
                                quarter={quarter}
                                category={category}
                                items={quarterItems}
                              >
                                {quarterItems.map((item) => (
                                  <DraggableTimelineItem
                                    key={item.id}
                                    item={item}
                                    category={category}
                                    onModalOpen={() => setIsDescriptionModalOpen(true)}
                                    onModalClose={() => setIsDescriptionModalOpen(false)}
                                    isDescriptionModalOpen={isDescriptionModalOpen}
                                  />
                                ))}
                              </DropZone>
                            );
                          })}
                        </div>
                      </div>
                    </DraggableCategory>
                  ))}
                  <AddCategoryButton />
                </div>
              </SortableContext>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">No categories found. Please add a category to get started.</p>
                <AddCategoryButton />
              </div>
            )}
          </div>

          <DragOverlay>
            {activeId && (
              activeId in categorySettings ? (
                // Dragging a category
                <div className="flex w-full bg-slate-900 shadow-lg rounded-lg">
                  <div className="w-40 flex-shrink-0 pr-4 py-2">
                    <div className={clsx(
                      'px-3 py-2 rounded font-semibold text-sm text-white',
                      categorySettings[activeId].color
                    )}>
                      {categorySettings[activeId].name}
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-800 rounded-r-lg" />
                </div>
              ) : (
                // Dragging an item
                items.find(item => item.id === activeId) && (
                  <TimelineItem 
                    item={items.find(item => item.id === activeId)!}
                    category={items.find(item => item.id === activeId)!.category}
                    isDragging={true}
                    onModalOpen={() => setIsDescriptionModalOpen(true)}
                    onModalClose={() => setIsDescriptionModalOpen(false)}
                  />
                )
              )
            )}
          </DragOverlay>
        </div>
      </div>
    </DndContext>
  );
}

// Type guard functions
function isValidCategory(category: string): boolean {
  const { categorySettings } = useRoadmapStore.getState();
  return Object.keys(categorySettings).includes(category);
}

function isValidQuarter(quarter: string): quarter is Quarter {
  return ['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter);
}

// Helper function to format quarter dates
function format(quarter: Quarter): string {
  const months = {
    Q1: 'Jan - Mar',
    Q2: 'Apr - Jun',
    Q3: 'Jul - Sep',
    Q4: 'Oct - Dec',
  };
  return months[quarter];
}