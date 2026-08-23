import React from 'react';
import '../styles/StatsBar.css';

interface StatsBarProps {
  totalCount: number;
  completedCount: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ totalCount, completedCount }) => {
  return (
    <div className="stats-bar">
      <div className="stat-card">
        <div className="stat-number">{totalCount}</div>
        <div className="stat-label">Total Tasks</div>
      </div>
      <div className="stat-card">
        <div className="stat-number stat-number-completed">{completedCount}</div>
        <div className="stat-label">Completed</div>
      </div>
    </div>
  );
};
