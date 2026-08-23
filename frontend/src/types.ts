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
  createdAt?: string | Date;
  dueDate?: string | Date;
  likes?: string[];
  comments?: Comment[];
}

export interface AuthState {
  token: string | null;
  username: string | null;
}
