export interface Comment {
  id: string;
  userId: string;
  userEmail?: string;
  username?: string;
  text: string;
  createdAt?: string | Date;
}

export interface Task {
  id: string;
  userId?: string;
  authorEmail?: string;
  authorUsername?: string;
  title: string;
  done: boolean;
  priority?: 'low' | 'medium' | 'high';
  startDate?: string | Date;
  dueDate?: string | Date;
  createdAt?: string | Date;
  likes?: string[];
  comments?: Comment[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  taskCount?: number;
  createdAt?: string;
}

export interface AuthState {
  token: string | null;
  username: string | null;
  userEmail: string | null;
  role: 'user' | 'admin' | null;
}

export interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
}
