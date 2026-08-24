'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { User, AdminStats } from '../types';
import { API_BASE_URL } from '../config';
import '../styles/AdminPanel.css';

interface AdminPanelProps {
  isOpen: boolean;
  token: string;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, token, onClose }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/stats`, { headers, credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/users`, { headers, credentials: 'include' }),
      ]);

      if (!statsRes.ok || !usersRes.ok) {
        throw new Error('Failed to load admin metrics or users');
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      setStats(statsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Error loading admin panel');
      toast.error(err.message || 'Error loading admin panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  const handleRoleToggle = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      toast.success(`User ${user.username} role updated to ${newRole}`);
    } catch (err: any) {
      toast.error(err.message || 'Error updating user role');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.username} and all their tasks?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete user');

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.info(`User ${user.username} deleted`);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="modal-icon">🛡️</span>
            <h3>Workspace Admin Dashboard</h3>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert-error">⚠️ {error}</div>}

          {loading ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <span>Loading admin metrics & user accounts...</span>
            </div>
          ) : (
            <>
              {stats && (
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <span className="stat-value">{stats.totalUsers}</span>
                    <span className="stat-label">Total Users</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="stat-value">{stats.totalTasks}</span>
                    <span className="stat-label">Total Tasks</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="stat-value text-success">{stats.completedTasks}</span>
                    <span className="stat-label">Completed Tasks</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="stat-value text-warning">{stats.activeTasks}</span>
                    <span className="stat-label">Active Tasks</span>
                  </div>
                </div>
              )}

              <h4 style={{ margin: '20px 0 12px 0', color: '#1e293b' }}>👥 User Account Management</h4>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Tasks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td><strong>{u.username}</strong></td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`role-badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                            {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                          </span>
                        </td>
                        <td>{u.taskCount || 0} tasks</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleRoleToggle(u)}
                            >
                              Toggle Role
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteUser(u)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
