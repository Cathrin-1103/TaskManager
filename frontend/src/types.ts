export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  likes?: string[];
  comments?: Comment[];
}

export interface AuthState {
  token: string | null;
  username: string | null;
}
