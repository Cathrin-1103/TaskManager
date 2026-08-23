import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Navbar } from './Navbar';
import { StatsBar } from './StatsBar';
import { TaskItem } from './TaskItem';
import { validateTaskTitle } from '../utils/validation';
import { API_BASE_URL } from '../config';
import '../styles/TaskManager.css';

interface TaskManagerProps {
  token: string;
  userEmail: string;
  username: string;
  userId?: string | null;
  onLogout: () => void;
}

const getDefaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

export const TaskManager: React.FC<TaskManagerProps> = ({ token, userEmail, username, userId, onLogout }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>(getDefaultDueDate());

  const [titleTouched, setTitleTouched] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const titleError = titleTouched ? validateTaskTitle(newTitle) : '';

  const fetchAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };
    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
    if (response.status === 401) {
      onLogout();
      throw new Error('Session expired. Please log in again.');
    }
    return response;
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchAuth('/tasks');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch tasks');
      
      const taskList: Task[] = Array.isArray(data)
        ? data
        : Object.values(data);
      setTasks(taskList);
    } catch (err: any) {
      setError(err.message || 'Error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [token]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleTouched(true);
    setFormError('');

    const tErr = validateTaskTitle(newTitle);
    if (tErr) {
      setFormError('Cannot submit task with validation errors.');
      return;
    }

    if (!newDueDate) {
      setFormError('Please select a due date for the task.');
      return;
    }

    try {
      const res = await fetchAuth('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          dueDate: new Date(newDueDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create task');

      setNewTitle('');
      setNewDueDate(getDefaultDueDate());
      setTitleTouched(false);
      loadTasks();
    } catch (err: any) {
      setError(err.message || 'Error creating task');
    }
  };

  const handleToggleDone = async (task: Task) => {
    try {
      const res = await fetchAuth(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ done: !task.done }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update task');
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
      );
    } catch (err: any) {
      setError(err.message || 'Error updating task');
    }
  };

  const handleToggleLike = async (task: Task) => {
    const isLiked = Boolean(
      task.likes &&
        task.likes.some(
          (idOrEmail) => (userId && idOrEmail === userId) || idOrEmail === userEmail || idOrEmail === username
        )
    );
    const method = isLiked ? 'DELETE' : 'POST';
    try {
      const res = await fetchAuth(`/tasks/${task.id}/like`, { method });
      const updatedTask = await res.json();
      if (!res.ok) throw new Error(updatedTask.message || 'Failed to update like');
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
    } catch (err: any) {
      setError(err.message || 'Error updating like');
    }
  };

  const handleAddComment = async (e: React.FormEvent, taskId: string, text: string) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await fetchAuth(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() }),
      });
      const updatedTask = await res.json();
      if (!res.ok) throw new Error(updatedTask.message || 'Failed to add comment');

      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (err: any) {
      setError(err.message || 'Error adding comment');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetchAuth(`/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete task');
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error deleting task');
    }
  };

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.done;
    if (filter === 'completed') return t.done;
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <div>
      <Navbar userEmail={userEmail} username={username} onLogout={onLogout} />

      <StatsBar totalCount={totalCount} completedCount={completedCount} />

      {error && <div className="alert-error">⚠️ {error}</div>}
      {formError && <div className="alert-error">⚠️ {formError}</div>}

      <form className="task-form task-form-vertical" onSubmit={handleAddTask}>
        <div className="task-form-row">
          <input
            type="text"
            className={`form-control task-input-title ${titleError ? 'is-invalid' : ''}`}
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              if (!titleTouched) setTitleTouched(true);
            }}
            onBlur={() => setTitleTouched(true)}
          />
          <input
            type="date"
            className="form-control task-input-date"
            title="Select End Date / Due Date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <button type="submit" className="btn btn-primary task-add-btn">
            + Add Task
          </button>
        </div>
        {titleError && <div className="task-validation-msg">⚠️ {titleError}</div>}
      </form>

      <div className="filter-bar">
        <button
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({totalCount})
        </button>
        <button
          className={`filter-chip ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({totalCount - completedCount})
        </button>
        <button
          className={`filter-chip ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({completedCount})
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <span>Loading workspace tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <span>No {filter !== 'all' ? filter : ''} tasks found.</span>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              userEmail={userEmail}
              username={username}
              userId={userId}
              onToggleDone={handleToggleDone}
              onToggleLike={handleToggleLike}
              onDeleteTask={handleDeleteTask}
              onAddComment={handleAddComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};
