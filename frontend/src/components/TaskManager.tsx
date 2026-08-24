'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Task } from '../types';
import { Navbar } from './Navbar';
import { StatsBar } from './StatsBar';
import { TaskItem } from './TaskItem';
import { ConfirmModal } from './ConfirmModal';
import { AdminPanel } from './AdminPanel';
import { validateTaskTitle } from '../utils/validation';
import { parseJsonResponse } from '../utils/api';
import { API_BASE_URL } from '../config';
import '../styles/TaskManager.css';

interface TaskManagerProps {
  token: string;
  userEmail: string;
  username: string;
  userId?: string | null;
  role?: string;
  onLogout: () => void;
}

const getDefaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

export const TaskManager: React.FC<TaskManagerProps> = ({ token, userEmail, username, userId, role, onLogout }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>(getDefaultDueDate());
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

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
    const response = await fetch(`${API_BASE_URL}${url}`, { credentials: 'include', ...options, headers });
    if (response.status === 401) {
      toast.error('Session expired. Please log in again.');
      onLogout();
      throw new Error('Session expired. Please log in again.');
    }
    return response;
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const queryParam = searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery.trim())}` : '';
      const res = await fetchAuth(`/tasks${queryParam}`);
      const data = await parseJsonResponse(res);
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
  }, [token, searchQuery]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleTouched(true);
    setFormError('');

    const tErr = validateTaskTitle(newTitle);
    if (tErr) {
      setFormError('Cannot submit task with validation errors.');
      toast.error('Please fix validation errors');
      return;
    }

    if (!newDueDate) {
      setFormError('Please select a due date for the task.');
      toast.error('Please select a due date');
      return;
    }

    try {
      const res = await fetchAuth('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          dueDate: new Date(newDueDate).toISOString(),
          priority: newPriority,
        }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || 'Failed to create task');

      setNewTitle('');
      setNewDueDate(getDefaultDueDate());
      setNewPriority('medium');
      setTitleTouched(false);
      toast.success('Task created successfully! 🎉');
      loadTasks();
    } catch (err: any) {
      setError(err.message || 'Error creating task');
      toast.error(err.message || 'Error creating task');
    }
  };

  const handleToggleDone = async (task: Task) => {
    try {
      const res = await fetchAuth(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ done: !task.done }),
      });
      if (!res.ok) {
        const data = await parseJsonResponse(res);
        throw new Error(data.message || 'Failed to update task');
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
      );
      toast.info(task.done ? 'Task marked active' : 'Task marked complete! ✅');
    } catch (err: any) {
      toast.error(err.message || 'Error updating task');
    }
  };

  const handleUpdateTask = async (id: string, updates: { title?: string; dueDate?: string; priority?: 'low' | 'medium' | 'high' }) => {
    try {
      const res = await fetchAuth(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const updatedTask = await parseJsonResponse(res);
      if (!res.ok) throw new Error(updatedTask.message || 'Failed to update task');

      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      toast.success('Task updated successfully! ✏️');
    } catch (err: any) {
      toast.error(err.message || 'Error updating task');
      throw err;
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
      const updatedTask = await parseJsonResponse(res);
      if (!res.ok) throw new Error(updatedTask.message || 'Failed to update like');
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
    } catch (err: any) {
      toast.error(err.message || 'Error updating like');
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
      const updatedTask = await parseJsonResponse(res);
      if (!res.ok) throw new Error(updatedTask.message || 'Failed to add comment');

      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      toast.success('Comment added 💬');
    } catch (err: any) {
      toast.error(err.message || 'Error adding comment');
    }
  };

  const confirmDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      const res = await fetchAuth(`/tasks/${deletingTaskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await parseJsonResponse(res);
        throw new Error(data.message || 'Failed to delete task');
      }
      setTasks((prev) => prev.filter((t) => t.id !== deletingTaskId));
      toast.warn('Task deleted');
    } catch (err: any) {
      toast.error(err.message || 'Error deleting task');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'active' && t.done) return false;
    if (statusFilter === 'completed' && !t.done) return false;
    if (priorityFilter !== 'all' && (t.priority || 'medium') !== priorityFilter) return false;
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <div>
      <Navbar
        userEmail={userEmail}
        username={username}
        role={role}
        onLogout={onLogout}
        onOpenAdmin={() => setShowAdminPanel(true)}
      />

      <AdminPanel
        isOpen={showAdminPanel}
        token={token}
        onClose={() => setShowAdminPanel(false)}
      />

      <StatsBar totalCount={totalCount} completedCount={completedCount} />

      <ConfirmModal
        isOpen={deletingTaskId !== null}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeletingTaskId(null)}
      />

      {error && <div className="alert-error">⚠️ {error}</div>}
      {formError && <div className="alert-error">⚠️ {formError}</div>}

      <form className="task-form task-form-vertical" onSubmit={handleAddTask}>
        <div className="task-form-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
            style={{ flex: 2, minWidth: '200px' }}
          />
          <input
            type="date"
            className="form-control task-input-date"
            title="Select End Date / Due Date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            style={{ flex: 1, minWidth: '130px' }}
          />
          <select
            className="form-control"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
            style={{ flex: 1, minWidth: '120px' }}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
          <button type="submit" className="btn btn-primary task-add-btn">
            + Add Task
          </button>
        </div>
        {titleError && <div className="task-validation-msg">⚠️ {titleError}</div>}
      </form>

      {/* Search & Filter Bar */}
      <div className="search-filter-container" style={{ margin: '16px 0', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search tasks by title, author, or comment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: '240px' }}
        />
        <select
          className="form-control"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          style={{ width: '160px' }}
        >
          <option value="all">All Priorities</option>
          <option value="high">🔴 High Priority</option>
          <option value="medium">🟡 Medium Priority</option>
          <option value="low">🟢 Low Priority</option>
        </select>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All ({totalCount})
        </button>
        <button
          className={`filter-chip ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          Active ({totalCount - completedCount})
        </button>
        <button
          className={`filter-chip ${statusFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('completed')}
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
          <span>No tasks found matching current filters.</span>
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
              onDeleteTask={(id) => setDeletingTaskId(id)}
              onUpdateTask={handleUpdateTask}
              onAddComment={handleAddComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};
