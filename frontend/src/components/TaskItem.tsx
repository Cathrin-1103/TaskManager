import React from 'react';
import { Task } from '../types';
import { CommentSection } from './CommentSection';

interface TaskItemProps {
  task: Task;
  userEmail: string;
  username: string;
  userId?: string | null;
  onToggleDone: (task: Task) => void;
  onToggleLike: (task: Task) => void;
  onDeleteTask: (id: string) => void;
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
  onAddComment,
}) => {
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

  return (
    <div className="task-item">
      <div className="task-header">
        <div className="task-title-area">
          <div
            className={`custom-checkbox ${task.done ? 'checked' : ''}`}
            onClick={() => onToggleDone(task)}
          >
            {task.done && '✓'}
          </div>
          <div>
            <span className={`task-title-text ${task.done ? 'done' : ''}`}>
              {task.title}
            </span>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.75rem', color: '#94a3b8', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                👤 {displayAuthor}
              </span>
              {startDateStr && <span>📅 Added: {startDateStr}</span>}
              {dueDateStr && <span style={{ color: task.done ? '#94a3b8' : '#f97316', fontWeight: 600 }}>⏰ Due: {dueDateStr}</span>}
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
            <button
              className="btn btn-danger"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => onDeleteTask(task.id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <CommentSection
        taskId={task.id}
        comments={commentsList}
        onAddComment={onAddComment}
      />
    </div>
  );
};
