export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

export const validateUsername = (username: string): string => {
  const trimmed = username.trim();
  if (!trimmed) return "Username is required";
  if (trimmed.length < 3) return "Username must be at least 3 characters";
  return "";
};

export const validateEmail = (email: string): string => {
  const trimmed = email.trim();
  if (!trimmed) return "Email address is required";
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address (e.g. user@example.com)";
  return "";
};

export const validatePassword = (password: string): string => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  if (!PASSWORD_REGEX.test(password)) return "Password must contain letters, numbers, and at least 1 special character (e.g. !@#$)";
  return "";
};

export const validateTaskTitle = (title: string): string => {
  if (!title || !title.trim()) return "Task title cannot be empty";
  return "";
};
