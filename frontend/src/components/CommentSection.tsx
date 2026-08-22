import React, { useState } from 'react';
import { Comment } from '../types';

interface CommentSectionProps {
  taskId: string;
  comments: Comment[];
  onAddComment: (e: React.FormEvent, taskId: string, text: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ taskId, comments, onAddComment }) => {
  const [commentText, setCommentText] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    setError('');
    onAddComment(e, taskId, commentText.trim());
    setCommentText('');
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        💬 Comments ({comments.length})
      </div>

      {comments.length > 0 && (
        <div className="comment-list">
          {comments.map((c) => {
            const authorTag = c.username ? c.username : (c.userEmail || 'Anonymous');
            return (
              <div key={c.id} className="comment-item">
                <span className="comment-author">{authorTag}</span>
                <span className="comment-text">{c.text}</span>
              </div>
            );
          })}
        </div>
      )}

      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="comment-input"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => {
            setCommentText(e.target.value);
            if (error) setError('');
          }}
        />
        <button
          type="submit"
          className="btn btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          Post
        </button>
      </form>
      {error && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>⚠️ {error}</div>}
    </div>
  );
};
