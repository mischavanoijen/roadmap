import Dexie, { Table } from 'dexie';
import { RoadmapItem } from '../types/roadmap';

interface CategorySettings {
  name: string;
  color: string;
  textColor: string;
}

interface Position {
  x: number;
  y: number;
}

export class RoadmapDatabase extends Dexie {
  items!: Table<RoadmapItem>;
  positions!: Table<Position & { id: string }>;
  categorySettings!: Table<CategorySettings & { id: string }>;
  categoryOrder!: Table<{ id: string; order: number }>;

  constructor() {
    super('RoadmapDB');
    this.version(1).stores({
      items: '++id, title, quarter, category, status, priority',
      positions: 'id',
      categorySettings: 'id',
      categoryOrder: 'id, order'
    });
  }
}

export const db = new RoadmapDatabase();

// Initialize database with default values if empty
export async function initializeDatabase(
  defaultItems: RoadmapItem[],
  defaultCategorySettings: Record<string, CategorySettings>,
  defaultCategoryOrder: string[]
) {
  const itemCount = await db.items.count();
  const settingsCount = await db.categorySettings.count();
  const orderCount = await db.categoryOrder.count();

  if (itemCount === 0) {
    await db.items.bulkAdd(defaultItems);
  }

  if (settingsCount === 0) {
    await db.categorySettings.bulkAdd(
      Object.entries(defaultCategorySettings).map(([id, settings]) => ({
        id,
        ...settings
      }))
    );
  }

  if (orderCount === 0) {
    await db.categoryOrder.bulkAdd(
      defaultCategoryOrder.map((id, index) => ({
        id,
        order: index
      }))
    );
  }
}

// Helper functions for database operations
export const dbOperations = {
  // Items
  getAllItems: () => db.items.toArray(),
  addItem: (item: RoadmapItem) => db.items.add(item),
  updateItem: (id: string, updates: Partial<RoadmapItem>) => db.items.update(id, updates),
  deleteItem: (id: string) => db.items.delete(id),
  
  // Positions
  getPosition: (id: string) => db.positions.get(id),
  updatePosition: (id: string, position: Position) => 
    db.positions.put({ id, ...position }),
  deletePosition: (id: string) => db.positions.delete(id),
  
  // Category Settings
  getAllCategorySettings: async () => {
    const settings = await db.categorySettings.toArray();
    return settings.reduce((acc, setting) => {
      const { id, ...rest } = setting;
      acc[id] = rest;
      return acc;
    }, {} as Record<string, CategorySettings>);
  },
  updateCategorySettings: (id: string, settings: Partial<CategorySettings>) =>
    db.categorySettings.update(id, settings),
  addCategory: async (id: string, settings: CategorySettings) => {
    await db.categorySettings.add({ id, ...settings });
    const maxOrder = await db.categoryOrder.orderBy('order').last();
    await db.categoryOrder.add({ id, order: (maxOrder?.order ?? -1) + 1 });
  },
  deleteCategory: async (id: string) => {
    await db.categorySettings.delete(id);
    await db.categoryOrder.delete(id);
  },
  
  // Category Order
  getCategoryOrder: async () => {
    const order = await db.categoryOrder.orderBy('order').toArray();
    return order.map(o => o.id);
  },
  reorderCategories: async (newOrder: string[]) => {
    await db.transaction('rw', db.categoryOrder, async () => {
      await db.categoryOrder.clear();
      await db.categoryOrder.bulkAdd(
        newOrder.map((id, index) => ({ id, order: index }))
      );
    });
  }
}; 