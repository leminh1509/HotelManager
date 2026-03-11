// src/components/ForgotPassword/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthHeader } from '../Header/Header';
import './ForgotPassword.css';

const STEPS = { EMAIL: 1, OTP: 2, NEW_PASSWORD: 3, SUCCESS: 4 };

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const getPasswordStrength = (pw) => {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)                                                    score++;
  if (/[A-Z]/.test(pw))                                                  score++;
  if (/[a-z]/.test(pw))                                                  score++;
  if (/\d/.test(pw))                                                     score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw))                score++;
  if (score <= 2) return { level: score, label: 'Yếu',        color: '#e53e3e' };
  if (score === 3) return { level: score, label: 'Trung bình', color: '#dd6b20' };
  if (score === 4) return { level: score, label: 'Khá mạnh',   color: '#d69e2e' };
  return              { level: score, label: 'Mạnh',           color: '#38a169' };
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const strength = getPasswordStrength(newPassword);

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!PASSWORD_REGEX.test(newPassword)) {
      setError('Mật khẩu phải ≥8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%...)');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
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

          <div className="fp-header">
            <h2>Quên mật khẩu</h2>
            <p>Đặt lại mật khẩu qua email của bạn</p>
          </div>

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

          {error && <div className="fp-alert">{error}</div>}

          {/* STEP 1: Email */}
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

          {/* STEP 2: OTP */}
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

          {/* STEP 3: Mật khẩu mới — ĐÃ NÂNG CẤP */}
          {step === STEPS.NEW_PASSWORD && (
            <form onSubmit={handleResetPassword}>
              <p className="fp-desc">Nhập mật khẩu mới cho tài khoản của bạn.</p>

              {/* Mật khẩu mới */}
              <div className="fp-group">
                <label>Mật khẩu mới <span className="fp-required">*</span></label>
                <div className="fp-pw-wrapper">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className="fp-input" required
                    placeholder="≥8 ký tự, chữ hoa, số, ký tự đặc biệt"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button" className="fp-pw-toggle"
                    onClick={() => setShowNewPw(v => !v)}
                    tabIndex={-1}
                  >
                    {showNewPw ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* Strength bar */}
                {newPassword && (
                  <div className="fp-strength">
                    <div className="fp-strength-bar">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="fp-strength-seg"
                          style={{ backgroundColor: i <= strength.level ? strength.color : '#e2e8f0' }}
                        />
                      ))}
                    </div>
                    <span className="fp-strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}

                {/* Checklist */}
                {newPassword && (
                  <ul className="fp-checklist">
                    <li className={newPassword.length >= 8 ? 'ok' : ''}>
                      {newPassword.length >= 8 ? '✓' : '○'} Ít nhất 8 ký tự
                    </li>
                    <li className={/[A-Z]/.test(newPassword) ? 'ok' : ''}>
                      {/[A-Z]/.test(newPassword) ? '✓' : '○'} Có chữ hoa (A–Z)
                    </li>
                    <li className={/[a-z]/.test(newPassword) ? 'ok' : ''}>
                      {/[a-z]/.test(newPassword) ? '✓' : '○'} Có chữ thường (a–z)
                    </li>
                    <li className={/\d/.test(newPassword) ? 'ok' : ''}>
                      {/\d/.test(newPassword) ? '✓' : '○'} Có chữ số (0–9)
                    </li>
                    <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'ok' : ''}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? '✓' : '○'} Có ký tự đặc biệt (!@#$%...)
                    </li>
                  </ul>
                )}
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="fp-group">
                <label>Xác nhận mật khẩu <span className="fp-required">*</span></label>
                <div className="fp-pw-wrapper">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    className="fp-input" required
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button" className="fp-pw-toggle"
                    onClick={() => setShowConfirmPw(v => !v)}
                    tabIndex={-1}
                  >
                    {showConfirmPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPassword && (
                  newPassword === confirmPassword
                    ? <p className="fp-match ok">✅ Mật khẩu khớp</p>
                    : <p className="fp-match err">❌ Mật khẩu chưa khớp</p>
                )}
              </div>

              <button
                type="submit" className="fp-btn"
                disabled={loading || !PASSWORD_REGEX.test(newPassword) || newPassword !== confirmPassword}
              >
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
              <button className="fp-btn" onClick={() => navigate('/login', { replace: true, state: { prefillEmail: email, prefillPassword: newPassword } })}>
                Đăng nhập
              </button>
            </div>
          )}

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