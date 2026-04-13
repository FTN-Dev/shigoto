export interface Task {
  id: string;
  created_at: string;
  title: string;
  description?: string | null;
  energy_level: 'deep' | 'shallow' | 'zombie' | 'pending' | string;
  status: string;
  deadline?: string | null;
  completed_at?: string | null;
}