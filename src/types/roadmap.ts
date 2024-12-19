export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type Status = 'planned' | 'in-progress' | 'completed';
export type Priority = 'low' | 'medium' | 'high';

export interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  quarter: Quarter;
  category: string;
  status: Status;
  priority: Priority;
  progress?: number;
  assignees?: string[];
  dependencies?: string[];
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  isMilestone?: boolean;
}