export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  quarter: Quarter;
  category: string;
}