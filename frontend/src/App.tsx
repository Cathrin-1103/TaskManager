import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthForm } from './components/AuthForm';
import { TaskManager } from './components/TaskManager';
import { API_BASE_URL } from './config';
import './index.css';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    // Attempt session restore via httpOnly cookie first
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
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
      .catch(() => {});
  }, []);

  const handleLoginSuccess = (newToken: string, loggedInEmail: string, loggedInUsername?: string, loggedInUserId?: string, loggedInRole?: string) => {
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

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
      {token && userEmail ? (
        <TaskManager
          token={token}
          userEmail={userEmail}
          username={username || userEmail.split('@')[0]}
          userId={userId}
          role={role || 'user'}
          onLogout={handleLogout}
        />
      ) : (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
              Task Workspace
            </h1>
          </div>
          <AuthForm onLoginSuccess={handleLoginSuccess} />
        </div>
      )}
    </div>
  );
}

export default App;
