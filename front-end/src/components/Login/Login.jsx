// src/components/Login/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthHeader } from '../Header/Header';
import './Login.css';

const GOOGLE_CLIENT_ID = '866996606723-a7k5c8ule1lqph6dgv9na94ek3k0bn0v.apps.googleusercontent.com';

const normalizeRole = (role) => {
  if (!role) return '';
  const r = String(role).toUpperCase();
  return r.startsWith('ROLE_') ? r.replace('ROLE_', '') : r;
};

const redirectByRole = (role, navigate) => {
  switch (role) {
    case 'ADMIN':       navigate('/admin', { replace: true }); break;
    case 'RECEPTIONIST': navigate('/receptionist', { replace: true }); break;
    case 'MAINTENANCE': navigate('/maintenance/dashboard', { replace: true }); break;
    case 'CUSTOMER':
    default:            navigate('/home', { replace: true }); break;
  }
};

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // ─── Load Google GSI script ───────────────────────────────────────────────
  useEffect(() => {
    const scriptId = 'google-gsi-script';
    if (document.getElementById(scriptId)) {
      initializeGoogleButton();
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleButton;
    document.head.appendChild(script);
  }, []);

  const initializeGoogleButton = () => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      }
    );
  };

  // ─── Google callback: nhận idToken từ Google ──────────────────────────────
  const handleGoogleCredentialResponse = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError('Không nhận được token từ Google.');
      return;
    }

    setGoogleLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:9999/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || 'Đăng nhập Google thất bại.');
        return;
      }

      const token = data?.token;
      if (!token) {
        setError('Phản hồi không có token.');
        return;
      }

      const role = normalizeRole(data?.role);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      const userData = {
        userId: data?.userId,
        email: data?.email,
        firstName: data?.firstName,
        lastName: data?.lastName,
        role,
      };
      localStorage.setItem('user', JSON.stringify(userData));

      if (onLoginSuccess) onLoginSuccess(userData);
      redirectByRole(role, navigate);

    } catch (err) {
      console.error('Google login error:', err);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Form thường ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        return;
      }

      const token = data?.token || data?.accessToken || data?.jwt;
      if (!token) { setError('Phản hồi không có token.'); return; }

      const role = normalizeRole(data?.role || data?.authority || (data?.roles?.[0] ?? ''));
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      const userData = {
        userId: data?.userId,
        email: data?.email || formData.email,
        firstName: data?.firstName,
        lastName: data?.lastName,
        role,
      };
      localStorage.setItem('user', JSON.stringify(userData));

      if (onLoginSuccess) onLoginSuccess(userData);
      redirectByRole(role, navigate);

    } catch (err) {
      console.error('Login error:', err);
      setError('Lỗi mạng. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthHeader />
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

            {/* ✅ GOOGLE SIGN-IN BUTTON */}
            <div className="google-signin-wrapper">
              {googleLoading ? (
                <div className="google-loading">
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang xác thực Google...
                </div>
              ) : (
                <div id="google-signin-btn" className="google-btn-container"></div>
              )}
            </div>

            {/* Divider */}
            <div className="divider">
              <span>hoặc đăng nhập bằng email</span>
            </div>

            {/* Email/Password Form */}
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
                <Link to="/register" className="register-link">Sign up now</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;