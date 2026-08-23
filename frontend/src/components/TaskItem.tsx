import React from 'react';
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
            <button
              className="btn btn-danger task-delete-btn"
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
