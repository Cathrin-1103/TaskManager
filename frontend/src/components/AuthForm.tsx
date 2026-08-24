import React, { useState } from 'react';
import { validateUsername, validateEmail, validatePassword } from '../utils/validation';
import { API_BASE_URL } from '../config';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import '../styles/AuthForm.css';

interface AuthFormProps {
  onLoginSuccess: (token: string, email: string, username?: string, userId?: string, role?: string) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const usernameError = (!isLoginMode && touched.username) ? validateUsername(username) : '';
  const emailError = touched.email ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (!touched.username) setTouched((prev) => ({ ...prev, username: true }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (!touched.email) setTouched((prev) => ({ ...prev, email: true }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (!touched.password) setTouched((prev) => ({ ...prev, password: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setMessage('');

    setTouched({ username: true, email: true, password: true });

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const uErr = !isLoginMode ? validateUsername(username) : '';

    if (eErr || pErr || uErr) {
      setFormError('Please resolve all highlighted validation errors before submitting.');
      return;
    }

    setLoading(true);
    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    const bodyPayload = isLoginMode
      ? { email: email.trim(), password: password.trim() }
      : { username: username.trim(), email: email.trim(), password: password.trim() };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isLoginMode) {
        const token = data.token || data.accessToken;
        if (token) {
          onLoginSuccess(token, email.trim(), data.username, data.userId, data.role);
        } else {
          setFormError('No token returned from server');
        }
      } else {
        setMessage('Account created successfully! Please log in with your email below.');
        setIsLoginMode(true);
        setPassword('');
        setUsername('');
        setTouched({});
      }
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />

      <div className="auth-tabs">
        <button
          className={`auth-tab ${isLoginMode ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setIsLoginMode(true);
            setFormError('');
            setMessage('');
            setTouched({});
          }}
        >
          Login
        </button>
        <button
          className={`auth-tab ${!isLoginMode ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setIsLoginMode(false);
            setFormError('');
            setMessage('');
            setTouched({});
          }}
        >
          Register
        </button>
      </div>

      {formError && <div className="alert-error">⚠️ {formError}</div>}
      {message && <div className="alert-success">✓ {message}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {!isLoginMode && (
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className={`form-control ${usernameError ? 'is-invalid' : ''}`}
              placeholder="Enter username (e.g. alex_dev)"
              value={username}
              onChange={handleUsernameChange}
              onBlur={() => handleBlur('username')}
            />
            {usernameError && <div className="auth-field-error-text">⚠️ {usernameError}</div>}
          </div>
        )}

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            className={`form-control ${emailError ? 'is-invalid' : ''}`}
            placeholder="Enter email (e.g. alex@taskmanager.com)"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
          />
          {emailError && <div className="auth-field-error-text">⚠️ {emailError}</div>}
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Password</label>
            {isLoginMode && (
              <button
                type="button"
                className="btn-link"
                style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.8rem', cursor: 'pointer' }}
                onClick={() => setShowForgotModal(true)}
              >
                Forgot Password?
              </button>
            )}
          </div>
          <input
            type="password"
            className={`form-control ${passwordError ? 'is-invalid' : ''}`}
            placeholder="Enter password (min 6 chars, letters, numbers, & !@#$)"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur('password')}
          />
          {passwordError && <div className="auth-field-error-text">⚠️ {passwordError}</div>}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Processing...' : isLoginMode ? 'Log In' : 'Register Account'}
        </button>
      </form>
    </div>
  );
};
