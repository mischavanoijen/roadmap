import { Quarter } from '../types/roadmap';

export const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export const STATUS_OPTIONS = ['planned', 'in-progress', 'completed'] as const;
export const PRIORITY_OPTIONS = ['low', 'medium', 'high'] as const;