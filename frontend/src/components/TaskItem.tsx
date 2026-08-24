import React, { useState } from 'react';
import { Task } from '../types';
import { CommentSection } from './CommentSection';
import '../styles/TaskItem.css';

interface TaskItemProps {
  task: Task;
  userEmail: string;
  username: string;
  userId?: string | null;
  onToggleDone: (task: Task) => void;
  onToggleLike: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: { title?: string; dueDate?: string; priority?: 'low' | 'medium' | 'high' }) => Promise<void>;
  onAddComment: (e: React.FormEvent, taskId: string, text: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  userEmail,
  username,
  userId,
  onToggleDone,
  onToggleLike,
  onDeleteTask,
  onUpdateTask,
  onAddComment,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>(task.title);
  const [editDueDate, setEditDueDate] = useState<string>(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>(
    task.priority || 'medium'
  );
  const [editError, setEditError] = useState<string>('');

  const likesCount = task.likes?.length || 0;
  const commentsList = task.comments || [];

  const startDateStr = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : undefined;

  const dueDateStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : undefined;

  const isLiked = Boolean(
    task.likes &&
      task.likes.some(
        (idOrEmail) => (userId && idOrEmail === userId) || idOrEmail === userEmail || idOrEmail === username
      )
  );

  const displayAuthor = task.authorUsername ? task.authorUsername : (task.authorEmail || 'Anonymous');

  const isCreator = Boolean(
    (userId && (task.userId === userId || task.userId === String(userId))) ||
      task.userId === userEmail ||
      task.authorEmail === userEmail ||
      (username && (task.userId === username || task.authorUsername === username))
  );

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      setEditError('Title cannot be empty');
      return;
    }
    try {
      setEditError('');
      await onUpdateTask(task.id, {
        title: editTitle.trim(),
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
        priority: editPriority,
      });
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update task');
    }
  };

  const getPriorityBadge = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return <span className="priority-badge priority-high">🔴 High</span>;
      case 'low':
        return <span className="priority-badge priority-low">🟢 Low</span>;
      case 'medium':
      default:
        return <span className="priority-badge priority-medium">🟡 Medium</span>;
    }
  };

  return (
    <div className="task-item">
      {isEditing ? (
        <div className="task-edit-container">
          <h4>✏️ Edit Task</h4>
          {editError && <div className="alert-error">⚠️ {editError}</div>}
          <div className="task-edit-inputs">
            <input
              type="text"
              className="form-control"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Task Title"
            />
            <input
              type="date"
              className="form-control"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />
            <select
              className="form-control"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🔴 High Priority</option>
            </select>
          </div>
          <div className="task-edit-actions">
            <button className="btn btn-primary" onClick={handleSaveEdit}>
              Save
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsEditing(false);
                setEditTitle(task.title);
                setEditError('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="task-header">
          <div className="task-title-area">
            <div
              className={`custom-checkbox ${task.done ? 'checked' : ''}`}
              onClick={() => onToggleDone(task)}
            >
              {task.done && '✓'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`task-title-text ${task.done ? 'done' : ''}`}>
                  {task.title}
                </span>
                {getPriorityBadge(task.priority)}
              </div>
              <div className="task-meta-info">
                <span className="task-author-badge">
                  👤 {displayAuthor}
                </span>
                {startDateStr && <span>📅 Added: {startDateStr}</span>}
                {dueDateStr && (
                  <span className={task.done ? 'task-due-date-done' : 'task-due-date'}>
                    ⏰ Due: {dueDateStr}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="task-actions">
            <button
              className={`like-btn ${isLiked ? 'liked' : ''}`}
              onClick={() => onToggleLike(task)}
            >
              {isLiked ? '♥' : '♡'} {likesCount}
            </button>
            {isCreator && (
              <>
                <button
                  className="btn btn-secondary task-edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger task-delete-btn"
                  onClick={() => onDeleteTask(task.id)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <CommentSection
        taskId={task.id}
        comments={commentsList}
        onAddComment={onAddComment}
      />
    </div>
  );
};
