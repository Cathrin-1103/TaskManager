import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request reset');

      if (data.resetToken) {
        setResetToken(data.resetToken);
        setSuccessMsg(`Reset token generated for dev: ${data.resetToken}`);
      } else {
        setSuccessMsg('Reset email sent! Please check your inbox.');
      }
      toast.success('Password reset link generated!');
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Error requesting reset');
      toast.error(err.message || 'Error requesting reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!resetToken.trim() || !newPassword.trim()) {
      setError('Token and new password are required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      toast.success('Password reset successful! You can now log in.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error resetting password');
      toast.error(err.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">🔐</span>
          <h3>{step === 'request' ? 'Forgot Password' : 'Reset Password'}</h3>
        </div>
        <div className="modal-body">
          {error && <div className="alert-error">⚠️ {error}</div>}
          {successMsg && <div className="alert-info" style={{ background: '#e0f2fe', color: '#0369a1', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>ℹ️ {successMsg}</div>}

          {step === 'request' ? (
            <form onSubmit={handleRequestReset}>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '12px' }}>
                Enter your registered email address to receive a password reset link/token.
              </p>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Reset Token</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Paste token..."
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="New password (e.g. Password123!)..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setStep('request')}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
