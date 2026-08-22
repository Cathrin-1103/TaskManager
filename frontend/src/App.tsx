import { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { TaskManager } from './components/TaskManager';
import { API_BASE_URL } from './config';
import './index.css';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedEmail = localStorage.getItem('userEmail');
    const savedUsername = localStorage.getItem('username');
    const savedUserId = localStorage.getItem('userId');

    if (savedToken && savedEmail) {
      setToken(savedToken);
      setUserEmail(savedEmail);
      setUsername(savedUsername || savedEmail.split('@')[0]);
      setUserId(savedUserId);
    }
  }, []);

  const handleLoginSuccess = (newToken: string, loggedInEmail: string, loggedInUsername?: string, loggedInUserId?: string) => {
    const finalUsername = loggedInUsername || loggedInEmail.split('@')[0];
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', loggedInEmail);
    localStorage.setItem('username', finalUsername);
    if (loggedInUserId) localStorage.setItem('userId', loggedInUserId);

    setToken(newToken);
    setUserEmail(loggedInEmail);
    setUsername(finalUsername);
    setUserId(loggedInUserId || null);
  };

  const handleLogout = () => {
    const savedRefreshToken = localStorage.getItem('refreshToken');
    if (savedRefreshToken) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: savedRefreshToken }),
      }).catch(() => {});
    }

    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUserEmail(null);
    setUsername(null);
    setUserId(null);
  };

  return (
    <div className="app-container">
      {token && userEmail ? (
        <TaskManager
          token={token}
          userEmail={userEmail}
          username={username || userEmail.split('@')[0]}
          userId={userId}
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
