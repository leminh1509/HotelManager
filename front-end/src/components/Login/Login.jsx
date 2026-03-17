// src/components/Login/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthHeader } from '../Header/Header';
import './Login.css';

const GOOGLE_CLIENT_ID = '866996606723-a7k5c8ule1lqph6dgv9na94ek3k0bn0v.apps.googleusercontent.com';

const normalizeRole = (role) => {
  if (!role) return '';
  const r = String(role).toUpperCase();
  return r.startsWith('ROLE_') ? r.replace('ROLE_', '') : r;
};

const redirectByRole = (role, navigate) => {
  const normalizedRole = normalizeRole(role);
  switch (normalizedRole) {
    case 'ADMIN':
      navigate('/admin', { replace: true });
      break;
    case 'RECEPTIONIST':
      navigate('/receptionist', { replace: true });
      break;
    case 'MAINTENANCE':
    case 'MAINTENANCE_MANAGER':
      navigate('/maintenance/dashboard', { replace: true });
      break;
    case 'CUSTOMER':
    default:
      navigate('/home', { replace: true });
      break;
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận prefill từ Register sau khi xác thực OTP thành công
  const prefillEmail = location.state?.prefillEmail || '';
  const prefillPassword = location.state?.prefillPassword || '';
  const justRegistered = location.state?.registered || false;

  const [formData, setFormData] = useState({
    email: prefillEmail,
    password: prefillPassword,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [successToast, setSuccessToast] = useState(justRegistered);

  // Tự ẩn toast sau 4 giây
  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [successToast]);

  // ── Google GSI ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const scriptId = 'google-gsi-script';
    if (document.getElementById(scriptId)) { initGoogleBtn(); return; }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleBtn;
    document.head.appendChild(script);
  }, []);

  const initGoogleBtn = () => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      {
        theme: 'outline', size: 'large', width: '100%',
        text: 'continue_with', shape: 'rectangular', logo_alignment: 'left'
      }
    );
  };

  // ── Google callback ─────────────────────────────────────────────────────────
  const handleGoogleResponse = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) { setErrors({ general: 'Không nhận được token từ Google.' }); return; }
    setGoogleLoading(true);
    setErrors({});
    try {
      const res = await fetch('http://localhost:9999/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ general: data?.message || 'Đăng nhập Google thất bại.' }); return; }

      const token = data?.token;
      if (!token) { setErrors({ general: 'Phản hồi không có token.' }); return; }

      const role = normalizeRole(data?.role);
      const userData = {
        userId: data?.userId, email: data?.email,
        firstName: data?.firstName, lastName: data?.lastName, role
      };
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(userData));
      if (onLoginSuccess) onLoginSuccess(userData);
      redirectByRole(role, navigate);
    } catch {
      setErrors({ general: 'Lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Handlers form ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.email.trim()) {
      e.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      e.email = 'Email không hợp lệ';
    }
    if (!formData.password) {
      e.password = 'Vui lòng nhập mật khẩu';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit login ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:9999/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.' });
        return;
      }
      const token = data?.token || data?.accessToken || data?.jwt;
      if (!token) { setErrors({ general: 'Phản hồi không có token.' }); return; }

      const role = normalizeRole(data?.role || data?.authority || (data?.roles?.[0] ?? ''));
      const userData = {
        userId: data?.userId, email: data?.email || formData.email,
        firstName: data?.firstName, lastName: data?.lastName, role
      };
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(userData));
      if (onLoginSuccess) onLoginSuccess(userData);
      redirectByRole(role, navigate);
    } catch {
      setErrors({ general: 'Lỗi mạng. Vui lòng kiểm tra kết nối.' });
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <AuthHeader />
      <div className="login-container">
        <div className="login-wrapper">
          <div className="login-card">
            {successToast && (
              <div className="toast-success" role="status">
                🎉 Đăng ký thành công! Vui lòng đăng nhập.
              </div>
            )}

            <div className="login-header">
              <h2>Chào mừng trở lại</h2>
              <p>Đăng nhập để tiếp tục</p>
            </div>

            {errors.general && (
              <div className="alert alert-danger" role="alert">{errors.general}</div>
            )}

            {/* Google Sign-in */}
            <div className="google-signin-wrapper">
              {googleLoading ? (
                <div className="google-loading">
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Đang xác thực Google...
                </div>
              ) : (
                <div id="google-signin-btn" className="google-btn-container" />
              )}
            </div>

            <div className="divider"><span>hoặc đăng nhập bằng email</span></div>

            <form onSubmit={handleSubmit} className="login-form" noValidate>

              {/* Email — prefilled nếu vừa đăng ký */}
              <div className="form-group">
                <label htmlFor="email">Địa chỉ Email</label>
                <input
                  type="email" id="email" name="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="Nhập email của bạn"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              {/* Password — prefilled nếu vừa đăng ký */}
              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPw ? 'text' : 'password'}
                    id="password" name="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button" className="password-toggle"
                    onClick={() => setShowPw(v => !v)} tabIndex={-1}
                    aria-label="Hiện/ẩn mật khẩu"
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
              </div>
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" id="remember" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Đang đăng nhập...
                  </>
                ) : 'Đăng Nhập'}
              </button>
            </form>

            <div className="login-footer">
              <p>
                Chưa có tài khoản?{' '}
                <Link to="/register" className="register-link">Đăng ký ngay</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;