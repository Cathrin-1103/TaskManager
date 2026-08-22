import React from 'react';

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
        <div className="stat-number" style={{ color: '#10b981' }}>{completedCount}</div>
        <div className="stat-label">Completed</div>
      </div>
    </div>
  );
};
