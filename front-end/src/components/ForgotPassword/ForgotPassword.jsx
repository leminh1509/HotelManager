// src/components/ForgotPassword/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header, { AuthHeader } from '../Header/Header';
import Footer from '../Footer/Footer';
import './ForgotPassword.css';

const STEPS = { EMAIL: 1, OTP: 2, NEW_PASSWORD: 3, SUCCESS: 4 };

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Đếm ngược resend
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Bước 1: Gửi OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:9999/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setStep(STEPS.OTP);
      startResendTimer();
    } catch {
      setError('Lỗi mạng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác thực OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:9999/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setStep(STEPS.NEW_PASSWORD);
    } catch {
      setError('Lỗi mạng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:9999/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setStep(STEPS.SUCCESS);
    } catch {
      setError('Lỗi mạng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:9999/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      startResendTimer();
    } catch {
      setError('Lỗi mạng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Nhập email', 'Nhập OTP', 'Mật khẩu mới'];

  return (
    <>
      <AuthHeader />
      <div className="fp-container">
        <div className="fp-card">

          {/* Header */}
          <div className="fp-header">
            <h2>Quên mật khẩu</h2>
            <p>Đặt lại mật khẩu qua email của bạn</p>
          </div>

          {/* Step indicator */}
          {step !== STEPS.SUCCESS && (
            <div className="fp-steps">
              {stepLabels.map((label, i) => (
                <div key={i} className={`fp-step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
                  <div className="fp-step-circle">{step > i + 1 ? '✓' : i + 1}</div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && <div className="fp-alert">{error}</div>}

          {/* STEP 1: Nhập email */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendOtp}>
              <p className="fp-desc">Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP đến hộp thư của bạn.</p>
              <div className="fp-group">
                <label>Email</label>
                <input
                  type="email" className="fp-input" required
                  placeholder="example@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="fp-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Gửi mã OTP'}
              </button>
            </form>
          )}

          {/* STEP 2: Nhập OTP */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp}>
              <p className="fp-desc">
                Mã OTP đã được gửi tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư (kể cả Spam).
              </p>
              <div className="fp-group">
                <label>Mã OTP (6 số)</label>
                <input
                  type="text" className="fp-input fp-otp-input" required
                  placeholder="_ _ _ _ _ _" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button type="submit" className="fp-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Xác nhận OTP'}
              </button>
              <div className="fp-resend">
                {resendTimer > 0
                  ? <span>Gửi lại sau {resendTimer}s</span>
                  : <button type="button" className="fp-link-btn" onClick={handleResend}>Gửi lại mã OTP</button>
                }
              </div>
              <button type="button" className="fp-back" onClick={() => { setStep(STEPS.EMAIL); setOtp(''); setError(''); }}>
                ← Thay đổi email
              </button>
            </form>
          )}

          {/* STEP 3: Nhập mật khẩu mới */}
          {step === STEPS.NEW_PASSWORD && (
            <form onSubmit={handleResetPassword}>
              <p className="fp-desc">Nhập mật khẩu mới cho tài khoản của bạn.</p>
              <div className="fp-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password" className="fp-input" required
                  placeholder="Ít nhất 6 ký tự"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="fp-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password" className="fp-input" required
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="fp-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}

          {/* STEP 4: Thành công */}
          {step === STEPS.SUCCESS && (
            <div className="fp-success">
              <div className="fp-success-icon">✅</div>
              <h3>Thành công!</h3>
              <p>Mật khẩu của bạn đã được đặt lại. Bạn có thể đăng nhập ngay bây giờ.</p>
              <button className="fp-btn" onClick={() => navigate('/login')}>
                Đăng nhập
              </button>
            </div>
          )}

          {/* Footer */}
          {step === STEPS.EMAIL && (
            <div className="fp-footer">
              <Link to="/login" className="fp-login-link">← Quay lại đăng nhập</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;