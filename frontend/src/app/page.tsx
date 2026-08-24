'use client';

import { useState, useEffect } from 'react';
import { AuthForm } from '../components/AuthForm';
import { TaskManager } from '../components/TaskManager';
import { API_BASE_URL } from '../config';

import { parseJsonResponse } from '../utils/api';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      credentials: 'include',
    })
      .then(async (res) => (res.ok ? await parseJsonResponse(res) : null))
      .then((data) => {
        if (data) {
          setUserEmail(data.email);
          setUsername(data.username);
          setUserId(data.id);
          setRole(data.role);
          setToken(localStorage.getItem('token') || 'cookie-session');
        } else {
          const savedToken = localStorage.getItem('token');
          const savedEmail = localStorage.getItem('userEmail');
          const savedUsername = localStorage.getItem('username');
          const savedUserId = localStorage.getItem('userId');
          const savedRole = localStorage.getItem('role') as 'user' | 'admin' | null;

          if (savedToken && savedEmail) {
            setToken(savedToken);
            setUserEmail(savedEmail);
            setUsername(savedUsername || savedEmail.split('@')[0]);
            setUserId(savedUserId);
            setRole(savedRole || 'user');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLoginSuccess = (
    newToken: string,
    loggedInEmail: string,
    loggedInUsername?: string,
    loggedInUserId?: string,
    loggedInRole?: string
  ) => {
    const finalUsername = loggedInUsername || loggedInEmail.split('@')[0];
    const finalRole = (loggedInRole as 'user' | 'admin') || 'user';

    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', loggedInEmail);
    localStorage.setItem('username', finalUsername);
    localStorage.setItem('role', finalRole);
    if (loggedInUserId) localStorage.setItem('userId', loggedInUserId);

    setToken(newToken);
    setUserEmail(loggedInEmail);
    setUsername(finalUsername);
    setUserId(loggedInUserId || null);
    setRole(finalRole);
  };

  const handleLogout = () => {
    const savedRefreshToken = localStorage.getItem('refreshToken');
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken: savedRefreshToken }),
    }).catch(() => {});

    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUserEmail(null);
    setUsername(null);
    setUserId(null);
    setRole(null);
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ marginTop: '100px' }}>
        <div className="empty-icon">⏳</div>
        <span>Initializing Next.js Task Workspace...</span>
      </div>
    );
  }

  return token && userEmail ? (
    <TaskManager
      token={token}
      userEmail={userEmail}
      username={username || userEmail.split('@')[0]}
      userId={userId}
      role={role || 'user'}
      onLogout={handleLogout}
    />
  ) : (
    <div className="auth-split-wrapper">
      <div className="hero-section">
        <div className="hero-badge">
          🚀 Next.js Task Workspace Platform
        </div>
        <h1 className="hero-title">
          Organize, Collaborate, and Execute Fast.
        </h1>
        <p className="hero-subtitle">
          Streamline your team&apos;s workflow with shared workspace collaboration, smart priority tracking, HTTP-only cookie security, and real-time task analytics.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <div>
              <div className="feature-title">Shared Workspace</div>
              <div className="feature-desc">Collaborate on tasks in real-time across your workspace.</div>
            </div>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🎯</span>
            <div>
              <div className="feature-title">Smart Priorities</div>
              <div className="feature-desc">Categorize tasks by High 🔴, Medium 🟡, and Low 🟢 priorities.</div>
            </div>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🛡️</span>
            <div>
              <div className="feature-title">Security & Admin</div>
              <div className="feature-desc">HTTP-Only cookies, CSP headers, rate limiting, and admin controls.</div>
            </div>
          </div>

          <div className="feature-card">
            <span className="feature-icon">💬</span>
            <div>
              <div className="feature-title">Comments & Likes</div>
              <div className="feature-desc">Engage on tasks with idempotent likes and discussion threads.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-section">
        <AuthForm onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
