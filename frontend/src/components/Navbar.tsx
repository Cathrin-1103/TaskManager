import React from 'react';
import '../styles/Navbar.css';

interface NavbarProps {
  userEmail: string;
  username: string;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ username, onLogout }) => {
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
