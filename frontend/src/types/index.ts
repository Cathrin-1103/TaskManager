export interface Comment {
  id: string;
  userId: string;
  userEmail: string;
  text: string;
  createdAt?: string | Date;
}

export interface Task {
  id: string;
  userId?: string;
  authorEmail?: string;
  title: string;
  done: boolean;
  startDate?: string | Date;
  dueDate?: string | Date;
  createdAt?: string | Date;
  likes?: string[];
  comments?: Comment[];
}
