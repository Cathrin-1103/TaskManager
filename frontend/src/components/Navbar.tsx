import React from 'react';
import '../styles/Navbar.css';

interface NavbarProps {
  userEmail: string;
  username: string;
  role?: string;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ username, role, onLogout, onOpenAdmin }) => {
  const userInitial = username ? username.charAt(0).toUpperCase() : 'U';

  return (
    <div className="app-header">
      <div className="brand-section">
        <div className="brand-icon">📋</div>
        <div>
          <h1 className="app-title">Task Workspace</h1>
        </div>
      </div>

      <div className="user-profile">
        <div className="avatar">{userInitial}</div>
        <span className="user-name">{username}</span>
        {role === 'admin' && onOpenAdmin && (
          <button
            className="btn btn-secondary navbar-admin-btn"
            style={{ borderColor: '#818cf8', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={onOpenAdmin}
          >
            🛡️ Admin
          </button>
        )}
        <button
          className="btn btn-secondary navbar-logout-btn"
          onClick={onLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};
