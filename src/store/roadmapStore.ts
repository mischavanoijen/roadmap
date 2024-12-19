import { create } from 'zustand';
import { Quarter, RoadmapItem } from '../types/roadmap';
import { persist } from 'zustand/middleware';

interface Position {
  x: number;
  y: number;
}

interface CategorySettings {
  name: string;
  color: string;
  textColor: string;
}

interface RoadmapStore {
  items: RoadmapItem[];
  positions: Record<string, Position>;
  categorySettings: Record<string, CategorySettings>;
  categoryOrder: string[];
  addEmptyItem: () => string;
  updateItem: (id: string, updates: Partial<RoadmapItem>) => void;
  updatePosition: (id: string, position: Position) => void;
  moveItem: (id: string, toQuarter: Quarter) => void;
  deleteItem: (id: string) => void;
  reorderItems: (category: string, quarter: Quarter, orderedIds: string[]) => void;
  updateCategorySettings: (category: string, settings: Partial<CategorySettings>) => void;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  reorderCategories: (newOrder: string[]) => void;
}

interface PersistedState {
  items: RoadmapItem[];
  positions: Record<string, Position>;
  categorySettings: Record<string, CategorySettings>;
  categoryOrder: string[];
}

const defaultCategorySettings = {
  OPERATIONS: { 
    name: 'Operations', 
    color: 'bg-blue-400', 
    textColor: 'text-black' 
  },
  'LOAD REDUCTION': { 
    name: 'Load Reduction', 
    color: 'bg-emerald-400', 
    textColor: 'text-black' 
  },
  'SERVICE QUALITY': { 
    name: 'Service Quality', 
    color: 'bg-violet-400', 
    textColor: 'text-black' 
  },
  SECURITY: { 
    name: 'Security', 
    color: 'bg-rose-400', 
    textColor: 'text-black' 
  },
} as Record<string, CategorySettings>;

export const useRoadmapStore = create<RoadmapStore>()(
  persist(
    (set) => ({
      items: [],
      positions: {},
      categorySettings: {...defaultCategorySettings},
      categoryOrder: Object.keys(defaultCategorySettings),
      addEmptyItem: () => {
        const id = crypto.randomUUID();
        set((state) => ({
          items: [
            ...state.items,
            {
              id,
              title: 'New Item',
              quarter: 'Q1',
              category: 'OPERATIONS',
            },
          ],
          positions: {
            ...state.positions,
            [id]: { x: 0, y: 0 },
          },
        }));
        return id;
      },
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      updatePosition: (id, position) =>
        set((state) => ({
          positions: {
            ...state.positions,
            [id]: position,
          },
        })),
      moveItem: (id, toQuarter) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quarter: toQuarter } : item
          ),
        })),
      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          positions: Object.fromEntries(
            Object.entries(state.positions).filter(([key]) => key !== id)
          ),
        })),
      reorderItems: (category, quarter, orderedIds) =>
        set((state) => {
          const itemMap = new Map(state.items.map(item => [item.id, item]));
          const otherItems = state.items.filter(
            item => item.category !== category || item.quarter !== quarter
          );
          const reorderedItems = orderedIds
            .map(id => itemMap.get(id))
            .filter((item): item is RoadmapItem => item !== undefined);
          return {
            items: [...otherItems, ...reorderedItems],
          };
        }),
      updateCategorySettings: (category, settings) =>
        set((state) => ({
          categorySettings: {
            ...state.categorySettings,
            [category]: {
              ...state.categorySettings[category],
              ...settings,
            },
          },
        })),
      addCategory: (category) =>
        set((state) => {
          if (state.categorySettings[category]) return state;

          // Available colors for new categories
          const colors = [
            'bg-indigo-400',
            'bg-purple-400', 
            'bg-cyan-400',
            'bg-teal-400',
            'bg-amber-400',
            'bg-orange-400',
            'bg-pink-400',
            'bg-lime-400'
          ];

          // Find a color that's not already in use
          const usedColors = Object.values(state.categorySettings).map(s => s.color);
          const availableColor = colors.find(c => !usedColors.includes(c)) || 'bg-slate-400';

          return {
            categorySettings: {
              ...state.categorySettings,
              [category]: {
                name: category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' '),
                color: availableColor,
                textColor: 'text-black',
              },
            },
            categoryOrder: [...state.categoryOrder, category],
          };
        }),
      deleteCategory: (category) =>
        set((state) => {
          const { [category]: _, ...remainingCategories } = state.categorySettings;
          return {
            categorySettings: remainingCategories,
            categoryOrder: state.categoryOrder.filter(c => c !== category),
            items: state.items.map(item =>
              item.category === category
                ? { ...item, category: 'OPERATIONS' }
                : item
            ),
          };
        }),
      reorderCategories: (newOrder) =>
        set(() => ({
          categoryOrder: newOrder,
        })),
    }),
    {
      name: 'roadmap-storage',
      version: 2,
      onRehydrateStorage: () => {
        console.log('Starting rehydration...');
        return (state) => {
          console.log('Rehydrated state:', {
            categorySettings: state?.categorySettings,
            categoryOrder: state?.categoryOrder
          });

          if (!state?.categorySettings || !state?.categoryOrder) {
            return {
              categorySettings: {...defaultCategorySettings},
              categoryOrder: Object.keys(defaultCategorySettings),
            };
          }
          return state;
        };
      },
      migrate: (persistedState: unknown) => {
        console.log('Migrating state:', { persistedState });
        const state = persistedState as PersistedState;
        const migratedState = {
          ...state,
          categorySettings: {
            ...defaultCategorySettings,
            ...state.categorySettings,
          },
          categoryOrder: state.categoryOrder || Object.keys(defaultCategorySettings),
        };
        console.log('Migrated state:', migratedState);
        return migratedState;
      },
    }
  )
);