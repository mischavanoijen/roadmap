import { create } from 'zustand';
import { Quarter, RoadmapItem } from '../types/roadmap';
import { db, dbOperations, initializeDatabase } from '../db/database';

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
  initialized: boolean;
  initialize: () => Promise<void>;
  addEmptyItem: () => Promise<string>;
  updateItem: (id: string, updates: Partial<RoadmapItem>) => Promise<void>;
  updatePosition: (id: string, position: Position) => Promise<void>;
  moveItem: (id: string, toQuarter: Quarter) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  reorderItems: (category: string, quarter: Quarter, orderedIds: string[]) => Promise<void>;
  updateCategorySettings: (category: string, settings: Partial<CategorySettings>) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;
  reorderCategories: (newOrder: string[]) => Promise<void>;
}

const defaultCategorySettings = {
  Features: { 
    name: 'Features', 
    color: 'bg-amber-400', 
    textColor: 'text-black' 
  },
  Integrations: { 
    name: 'Integrations', 
    color: 'bg-emerald-400', 
    textColor: 'text-black' 
  },
  Agents: { 
    name: 'Agents', 
    color: 'bg-rose-400', 
    textColor: 'text-black' 
  },
  Security: { 
    name: 'Security', 
    color: 'bg-violet-400', 
    textColor: 'text-black' 
  },
  Compliance: {
    name: 'Compliance',
    color: 'bg-purple-400',
    textColor: 'text-black'
  },
  Azure: {
    name: 'Azure',
    color: 'bg-orange-400',
    textColor: 'text-black'
  }
} as Record<string, CategorySettings>;

// Default items for demonstration
const defaultItems: RoadmapItem[] = [
  // Features
  {
    id: 'f1',
    title: 'User Personalization',
    description: 'Personalized user experience and settings',
    quarter: 'Q1',
    category: 'Features',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'f2',
    title: 'Agents/Tools/Prompts directory',
    description: 'Directory for managing agents, tools and prompts',
    quarter: 'Q1',
    category: 'Features',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'f3',
    title: "Knowledge Area's",
    description: 'Structured knowledge areas for better organization',
    quarter: 'Q1',
    category: 'Features',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'f4',
    title: 'Async File upload',
    description: 'Asynchronous file upload functionality',
    quarter: 'Q1',
    category: 'Features',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'f5',
    title: 'Smart document splitting',
    description: 'Intelligent document splitting capabilities',
    quarter: 'Q1',
    category: 'Features',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'f6',
    title: 'FinOps dashboard',
    description: 'Financial operations dashboard',
    quarter: 'Q1',
    category: 'Features',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'f7',
    title: 'RAG Image upload (vision)',
    description: 'Image upload with vision capabilities',
    quarter: 'Q1',
    category: 'Features',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'f8',
    title: 'Image analyses for chat',
    description: 'Chat-based image analysis',
    quarter: 'Q1',
    category: 'Features',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'f9',
    title: 'Code interpretation',
    description: 'Code interpretation capabilities',
    quarter: 'Q1',
    category: 'Features',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'f10',
    title: 'Desktop client (MacOs/Win)',
    description: 'Native desktop client for MacOS and Windows',
    quarter: 'Q2',
    category: 'Features',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'f11',
    title: 'GraphRAG',
    description: 'Graph-based RAG implementation',
    quarter: 'Q2',
    category: 'Features',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'f12',
    title: 'Backend refactor full m/cro-services',
    description: 'Complete backend refactoring to microservices',
    quarter: 'Q2',
    category: 'Features',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'f13',
    title: 'Platform/Department invoice generation',
    description: 'Automated invoice generation by platform/department',
    quarter: 'Q2',
    category: 'Features',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'f14',
    title: 'Unit test automation',
    description: 'Automated unit testing implementation',
    quarter: 'Q2',
    category: 'Features',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'f15',
    title: 'Build your own assistant',
    description: 'Custom assistant building capability',
    quarter: 'Q2',
    category: 'Features',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'f16',
    title: 'Advanced Reporting',
    description: 'Enhanced reporting capabilities',
    quarter: 'Q3',
    category: 'Features',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'f17',
    title: 'Multi-model LLM routing',
    description: 'Intelligent routing between multiple LLM models',
    quarter: 'Q3',
    category: 'Features',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'f18',
    title: 'Build your own Agent',
    description: 'Custom agent building capability',
    quarter: 'Q3',
    category: 'Features',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },

  // Integrations
  {
    id: 'i1',
    title: 'PISA IT KB',
    description: 'PISA IT Knowledge Base integration',
    quarter: 'Q1',
    category: 'Integrations',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'i2',
    title: 'SSP',
    description: 'SSP Integration',
    quarter: 'Q1',
    category: 'Integrations',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'i3',
    title: 'PISA HR KB',
    description: 'PISA HR Knowledge Base integration',
    quarter: 'Q1',
    category: 'Integrations',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'i4',
    title: 'SharePoint',
    description: 'SharePoint integration',
    quarter: 'Q1',
    category: 'Integrations',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'i5',
    title: 'Webkit',
    description: 'Webkit integration',
    quarter: 'Q1',
    category: 'Integrations',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'i6',
    title: "Functional API's",
    description: 'Functional API integrations',
    quarter: 'Q1',
    category: 'Integrations',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'i7',
    title: 'CoPilot connector',
    description: 'Integration with GitHub Copilot',
    quarter: 'Q2',
    category: 'Integrations',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'i8',
    title: 'PowerApp connector',
    description: 'Microsoft PowerApp integration',
    quarter: 'Q2',
    category: 'Integrations',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'i9',
    title: 'ServiceNow connector',
    description: 'ServiceNow integration',
    quarter: 'Q2',
    category: 'Integrations',
    status: 'planned',
    priority: 'medium',
    progress: 0,
  },
  {
    id: 'i10',
    title: 'SAP connector',
    description: 'SAP integration',
    quarter: 'Q3',
    category: 'Integrations',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },

  // Agents
  {
    id: 'a1',
    title: '3 agentic use-cases',
    description: 'Implementation of 3 agentic use cases',
    quarter: 'Q1',
    category: 'Agents',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'a2',
    title: 'Assistants',
    description: 'AI Assistant implementations',
    quarter: 'Q1',
    category: 'Agents',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'a3',
    title: '6 agentic use-cases',
    description: 'Implementation of 6 agentic use cases',
    quarter: 'Q2',
    category: 'Agents',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'a4',
    title: 'Agent micro-service',
    description: 'Microservice for agent management',
    quarter: 'Q2',
    category: 'Agents',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'a5',
    title: '10 agentic use-cases',
    description: 'Implementation of 10 agentic use cases',
    quarter: 'Q3',
    category: 'Agents',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'a6',
    title: "SLM's for agents",
    description: 'Service Level Management for agents',
    quarter: 'Q3',
    category: 'Agents',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'a7',
    title: '25 agentic use-cases',
    description: 'Implementation of 25 agentic use cases',
    quarter: 'Q4',
    category: 'Agents',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'a8',
    title: 'Predictive analyses',
    description: 'Predictive analysis capabilities',
    quarter: 'Q4',
    category: 'Agents',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },

  // Security
  {
    id: 's1',
    title: 'PenTest 1',
    description: 'First penetration testing phase',
    quarter: 'Q1',
    category: 'Security',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 's2',
    title: "Role-Based API's",
    description: 'Role-based API implementation',
    quarter: 'Q1',
    category: 'Security',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 's3',
    title: 'PenTest 2',
    description: 'Second penetration testing phase',
    quarter: 'Q3',
    category: 'Security',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },

  // Compliance
  {
    id: 'c1',
    title: 'CAPD-C Global',
    description: 'Global CAPD-C compliance',
    quarter: 'Q1',
    category: 'Compliance',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'c2',
    title: 'CAPD-C Germany',
    description: 'Germany-specific CAPD-C compliance',
    quarter: 'Q1',
    category: 'Compliance',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'c3',
    title: 'WorkerCouncil agreements',
    description: 'Worker Council agreement implementations',
    quarter: 'Q1',
    category: 'Compliance',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },

  // Azure
  {
    id: 'az1',
    title: 'ITSM integration',
    description: 'Integration with ITSM systems',
    quarter: 'Q1',
    category: 'Azure',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'az2',
    title: 'Single reason HA zones',
    description: 'High Availability zones implementation',
    quarter: 'Q1',
    category: 'Azure',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'az3',
    title: 'Code sandbox Azure containers',
    description: 'Azure container sandboxing implementation',
    quarter: 'Q1',
    category: 'Azure',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'az4',
    title: 'LLM aided Document Intelligence',
    description: 'Document intelligence with LLM support',
    quarter: 'Q2',
    category: 'Azure',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'az5',
    title: 'BFF with APIM',
    description: 'Backend for Frontend with API Management',
    quarter: 'Q2',
    category: 'Azure',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
  {
    id: 'az6',
    title: 'APIM for LLM load balancing',
    description: 'API Management for LLM load balancing',
    quarter: 'Q2',
    category: 'Azure',
    status: 'planned',
    priority: 'high',
    progress: 0,
  },
];

export const useRoadmapStore = create<RoadmapStore>()((set, get) => ({
  items: [],
  positions: {},
  categorySettings: {},
  categoryOrder: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    await initializeDatabase(defaultItems, defaultCategorySettings, Object.keys(defaultCategorySettings));
    
    const items = await dbOperations.getAllItems();
    const categorySettings = await dbOperations.getAllCategorySettings();
    const categoryOrder = await dbOperations.getCategoryOrder();
    const positions = await db.positions.toArray();

    set({
      items,
      categorySettings,
      categoryOrder,
      positions: positions.reduce((acc, pos) => {
        const { id, ...position } = pos;
        acc[id] = position;
        return acc;
      }, {} as Record<string, Position>),
      initialized: true
    });
  },

  addEmptyItem: async () => {
    const id = crypto.randomUUID();
    const newItem: RoadmapItem = {
      id,
      title: 'New Item',
      description: '',
      quarter: 'Q1',
      category: Object.keys(get().categorySettings)[0],
      status: 'planned',
      priority: 'medium',
      progress: 0,
    };

    await dbOperations.addItem(newItem);
    await dbOperations.updatePosition(id, { x: 0, y: 0 });

    set((state) => ({
      items: [...state.items, newItem],
      positions: {
        ...state.positions,
        [id]: { x: 0, y: 0 },
      },
    }));

    return id;
  },

  updateItem: async (id, updates) => {
    await dbOperations.updateItem(id, updates);
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  updatePosition: async (id, position) => {
    await dbOperations.updatePosition(id, position);
    set((state) => ({
      positions: {
        ...state.positions,
        [id]: position,
      },
    }));
  },

  moveItem: async (id, toQuarter) => {
    await dbOperations.updateItem(id, { quarter: toQuarter });
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quarter: toQuarter } : item
      ),
    }));
  },

  deleteItem: async (id) => {
    await dbOperations.deleteItem(id);
    await dbOperations.deletePosition(id);
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      positions: Object.fromEntries(
        Object.entries(state.positions).filter(([key]) => key !== id)
      ),
    }));
  },

  reorderItems: async (category, quarter, orderedIds) => {
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
    });
  },

  updateCategorySettings: async (category, settings) => {
    await dbOperations.updateCategorySettings(category, settings);
    set((state) => ({
      categorySettings: {
        ...state.categorySettings,
        [category]: {
          ...state.categorySettings[category],
          ...settings,
        },
      },
    }));
  },

  addCategory: async (category) => {
    const state = get();
    if (state.categorySettings[category]) return;

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

    const newSettings = {
      name: category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' '),
      color: availableColor,
      textColor: 'text-black',
    };

    await dbOperations.addCategory(category, newSettings);

    set((state) => ({
      categorySettings: {
        ...state.categorySettings,
        [category]: newSettings,
      },
      categoryOrder: [...state.categoryOrder, category],
    }));
  },

  deleteCategory: async (category) => {
    await dbOperations.deleteCategory(category);
    set((state) => {
      const remainingCategories = { ...state.categorySettings };
      delete remainingCategories[category];
      return {
        categorySettings: remainingCategories,
        categoryOrder: state.categoryOrder.filter(c => c !== category),
        items: state.items.map(item =>
          item.category === category
            ? { ...item, category: Object.keys(remainingCategories)[0] }
            : item
        ),
      };
    });
  },

  reorderCategories: async (newOrder) => {
    await dbOperations.reorderCategories(newOrder);
    set(() => ({
      categoryOrder: newOrder,
    }));
  },
}));