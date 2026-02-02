// src/components/Login/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const normalizeRole = (role) => {
  if (!role) return '';
  const r = String(role).toUpperCase();
  return r.startsWith('ROLE_') ? r.replace('ROLE_', '') : r;
};

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:9999/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || 'Login failed. Please try again.');
        return;
      }
      const token = data?.token || data?.accessToken || data?.jwt;
      if (!token) {
        setError('Login response missing token.');
        return;
      }

      const role = normalizeRole(data?.role || data?.authority || (data?.roles?.[0] ?? ''));
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      const userData = {
        userId: data?.userId,
        email: data?.email || formData.email,
        firstName: data?.firstName,
        lastName: data?.lastName,
        role
      };

      localStorage.setItem('user', JSON.stringify(userData));

      if (onLoginSuccess) onLoginSuccess(userData);
      switch (role) {
        case 'ADMIN':
          navigate('/admin', { replace: true }); // <-- quan trọng
          break;
        case 'RECEPTIONIST':
          navigate('/receptionist/booking-list', { replace: true });
          break;
        case 'MAINTENANCE':
          navigate('/maintenance/dashboard', { replace: true });
          break;
        case 'CUSTOMER':
        default:
          navigate('/home', { replace: true });
          break;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to continue to Hotel</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="register-link">
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
