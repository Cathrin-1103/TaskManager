'use client';

import React from 'react';
import '../styles/StatsBar.css';

interface StatsBarProps {
  totalCount: number;
  completedCount: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ totalCount, completedCount }) => {
  const activeCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="stats-container">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div>
            <div className="stat-number">{totalCount}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">⚡</span>
          <div>
            <div className="stat-number text-warning">{activeCount}</div>
            <div className="stat-label">Active Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div>
            <div className="stat-number text-success">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div>
            <div className="stat-number text-primary">{progressPercent}%</div>
            <div className="stat-label">Progress</div>
          </div>
        </div>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
