// src/components/Register/Register.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthHeader } from '../Header/Header';
import './Register.css';

// ─── Bước đăng ký ────────────────────────────────────────────────────────────
const STEP_FORM = 'FORM';  // Bước 1: điền thông tin
const STEP_OTP = 'OTP';   // Bước 2: nhập OTP xác thực email

// ─── Regex mật khẩu mạnh ─────────────────────────────────────────────────────
// ≥8 ký tự, có chữ hoa, chữ thường, số VÀ ký tự đặc biệt
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// ─── Độ mạnh mật khẩu ────────────────────────────────────────────────────────
const getPasswordStrength = (pw) => {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) score++;
  if (score <= 2) return { level: score, label: 'Yếu', color: '#e53e3e' };
  if (score === 3) return { level: score, label: 'Trung bình', color: '#dd6b20' };
  if (score === 4) return { level: score, label: 'Khá mạnh', color: '#d69e2e' };
  return { level: score, label: 'Mạnh', color: '#38a169' };
};

// ─── Kiểm tra ≥ 18 tuổi ──────────────────────────────────────────────────────
const isAtLeast18 = (birthdayStr) => {
  if (!birthdayStr) return false;
  const birth = new Date(birthdayStr);
  const cutoff = new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate());
  return new Date() >= cutoff;
};

// Max date cho input date = hôm nay trừ 18 năm
const getMaxBirthday = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
};

// ─── Component 6 ô OTP ───────────────────────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
  const refs = useRef([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    onChange(next.join('').replace(/ /g, ''));
    if (char && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = '';
        onChange(next.join('').replace(/ /g, ''));
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="otp-boxes">
      {[0, 1, 2, 3, 4, 5].map(idx => (
        <input
          key={idx}
          ref={el => refs.current[idx] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`otp-box${digits[idx] ? ' filled' : ''}`}
          value={digits[idx] === ' ' ? '' : digits[idx]}
          onChange={e => handleChange(e, idx)}
          onKeyDown={e => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};

// ─── Register ────────────────────────────────────────────────────────────────
const Register = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP_FORM);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '',
    email: '', password: '', confirmPassword: '',
    mobilePhone: '', birthday: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // OTP state
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const timerRef = useRef(null);

  // Đếm ngược khi vào bước OTP
  useEffect(() => {
    if (step === STEP_OTP) {
      startResendTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const startResendTimer = () => {
    setResendTimer(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const strength = getPasswordStrength(formData.password);

  // ── Xử lý thay đổi input ──────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ── Validate form ─────────────────────────────────────────────────────────
  const validateForm = () => {
    const e = {};
    if (!formData.firstName.trim()) e.firstName = 'Vui lòng nhập họ';
    if (!formData.lastName.trim()) e.lastName = 'Vui lòng nhập tên';

    if (!formData.email.trim()) {
      e.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      e.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      e.password = 'Vui lòng nhập mật khẩu';
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      e.password = 'Mật khẩu phải ≥8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%...)';
    }

    if (!formData.confirmPassword) {
      e.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      e.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (formData.mobilePhone && !/^[0-9]{10,20}$/.test(formData.mobilePhone)) {
      e.mobilePhone = 'Số điện thoại phải 10–20 chữ số';
    }

    if (!formData.birthday) {
      e.birthday = 'Vui lòng nhập ngày sinh';
    } else if (!isAtLeast18(formData.birthday)) {
      e.birthday = 'Bạn phải đủ 18 tuổi để đăng ký tài khoản';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit form → gọi API register → backend gửi OTP về email ───────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await fetch('http://localhost:9999/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      const data = await response.json();
      if (response.ok) {
        setStep(STEP_OTP);
      } else {
        if (data.validationErrors) setErrors(data.validationErrors);
        else setErrors({ general: data.message || 'Đăng ký thất bại. Vui lòng thử lại.' });
      }
    } catch {
      setErrors({ general: 'Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Gửi lại OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);
    setOtpError('');
    try {
      await fetch('http://localhost:9999/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      startResendTimer();
    } catch {
      setOtpError('Không thể gửi lại OTP. Vui lòng thử lại.');
    } finally {
      setResendLoading(false);
    }
  };

  // ── Xác thực OTP → thành công → navigate('/login') kèm prefill ───────────
  const handleVerifyOtp = async () => {
    if (otpValue.replace(/ /g, '').length < 6) {
      setOtpError('Vui lòng nhập đủ 6 số OTP');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const response = await fetch('http://localhost:9999/api/auth/verify-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpValue })
      });
      const data = await response.json();
      if (response.ok) {
        // ✅ Xác thực thành công → chuyển sang login, prefill email + password
        navigate('/login', {
          replace: true,
          state: {
            prefillEmail: formData.email,
            prefillPassword: formData.password,
            registered: true   // Login.jsx dùng flag này để hiện toast "Đăng ký thành công"
          }
        });
      } else {
        setOtpError(data.message || 'OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.');
      }
    } catch {
      setOtpError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: bước OTP
  // ────────────────────────────────────────────────────────────────────────────
  if (step === STEP_OTP) {
    return (
      <>
        <AuthHeader />
        <div className="register-container">
          <div className="register-wrapper">
            <div className="register-card">

              {/* Step indicator */}
              <div className="step-indicator">
                <div className="step done">
                  <span className="step-dot">✓</span>
                  <span className="step-label">Thông tin</span>
                </div>
                <div className="step-line active" />
                <div className="step active">
                  <span className="step-dot">2</span>
                  <span className="step-label">Xác thực</span>
                </div>
              </div>

              <div className="register-header">
                <div className="otp-icon-wrap">✉️</div>
                <h2>Xác thực Email</h2>
                <p>
                  Mã OTP 6 số đã được gửi đến<br />
                  <strong>{formData.email}</strong><br />
                  <small>Vui lòng kiểm tra hộp thư (kể cả Spam)</small>
                </p>
              </div>

              {otpError && (
                <div className="alert alert-danger" role="alert">{otpError}</div>
              )}

              <div className="otp-section">
                <OtpInput value={otpValue} onChange={setOtpValue} />

                <button
                  className="btn-register"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || otpValue.replace(/ /g, '').length < 6}
                >
                  {otpLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Đang xác thực...
                    </>
                  ) : 'Xác nhận & Đăng ký'}
                </button>

                <div className="resend-section">
                  {resendTimer > 0 ? (
                    <p className="resend-timer">
                      Gửi lại mã sau <strong className="timer-count">{resendTimer}s</strong>
                    </p>
                  ) : (
                    <button
                      className="btn-resend"
                      onClick={handleResendOtp}
                      disabled={resendLoading}
                    >
                      {resendLoading ? 'Đang gửi...' : '🔄 Gửi lại mã OTP'}
                    </button>
                  )}
                </div>

                <button
                  className="btn-back-link"
                  onClick={() => { setStep(STEP_FORM); setOtpValue(''); setOtpError(''); }}
                >
                  ← Quay lại sửa thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: bước FORM
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <AuthHeader />
      <div className="register-container">
        <div className="register-wrapper">
          <div className="register-card">

            {/* Step indicator */}
            <div className="step-indicator">
              <div className="step active">
                <span className="step-dot">1</span>
                <span className="step-label">Thông tin</span>
              </div>
              <div className="step-line" />
              <div className="step">
                <span className="step-dot">2</span>
                <span className="step-label">Xác thực</span>
              </div>
            </div>

            <div className="register-header">
              <h2>Tạo Tài Khoản</h2>
              <p>Đăng ký để trải nghiệm dịch vụ khách sạn</p>
            </div>

            {errors.general && (
              <div className="alert alert-danger" role="alert">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit} className="register-form" noValidate>

              {/* Họ + Tên đệm */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Họ <span className="required">*</span></label>
                  <input
                    type="text" id="firstName" name="firstName"
                    className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                    placeholder="Nguyễn"
                    value={formData.firstName} onChange={handleChange}
                  />
                  {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="middleName">Tên đệm</label>
                  <input
                    type="text" id="middleName" name="middleName"
                    className="form-control" placeholder="Văn (tuỳ chọn)"
                    value={formData.middleName} onChange={handleChange}
                  />
                </div>
              </div>

              {/* Tên */}
              <div className="form-group">
                <label htmlFor="lastName">Tên <span className="required">*</span></label>
                <input
                  type="text" id="lastName" name="lastName"
                  className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                  placeholder="An"
                  value={formData.lastName} onChange={handleChange}
                />
                {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">Địa chỉ Email <span className="required">*</span></label>
                <input
                  type="email" id="email" name="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="example@gmail.com"
                  value={formData.email} onChange={handleChange}
                  autoComplete="email"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              {/* Số điện thoại */}
              <div className="form-group">
                <label htmlFor="mobilePhone">Số điện thoại</label>
                <input
                  type="tel" id="mobilePhone" name="mobilePhone"
                  className={`form-control ${errors.mobilePhone ? 'is-invalid' : ''}`}
                  placeholder="0912345678"
                  value={formData.mobilePhone} onChange={handleChange}
                />
                {errors.mobilePhone && <div className="invalid-feedback">{errors.mobilePhone}</div>}
              </div>

              {/* Ngày sinh — max = hôm nay - 18 năm */}
              <div className="form-group">
                <label htmlFor="birthday">
                  Ngày sinh <span className="required">*</span>
                  <span className="field-hint"> — phải đủ 18 tuổi</span>
                </label>
                <input
                  type="date" id="birthday" name="birthday"
                  className={`form-control ${errors.birthday ? 'is-invalid' : ''}`}
                  max={getMaxBirthday()}
                  value={formData.birthday} onChange={handleChange}
                />
                {errors.birthday && <div className="invalid-feedback">{errors.birthday}</div>}
              </div>

              {/* Mật khẩu */}
              <div className="form-group">
                <label htmlFor="password">
                  Mật khẩu <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPw ? 'text' : 'password'}
                    id="password" name="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="≥8 ký tự, chữ hoa, số, ký tự đặc biệt"
                    value={formData.password} onChange={handleChange}
                    autoComplete="new-password"
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

                {/* Strength bar */}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="strength-segment"
                          style={{ backgroundColor: i <= strength.level ? strength.color : '#e2e8f0' }}
                        />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}

                {/* Checklist yêu cầu mật khẩu */}
                {formData.password && (
                  <ul className="password-checklist">
                    <li className={formData.password.length >= 8 ? 'ok' : ''}>
                      {formData.password.length >= 8 ? '✓' : '○'} Ít nhất 8 ký tự
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'ok' : ''}>
                      {/[A-Z]/.test(formData.password) ? '✓' : '○'} Có chữ hoa (A–Z)
                    </li>
                    <li className={/[a-z]/.test(formData.password) ? 'ok' : ''}>
                      {/[a-z]/.test(formData.password) ? '✓' : '○'} Có chữ thường (a–z)
                    </li>
                    <li className={/\d/.test(formData.password) ? 'ok' : ''}>
                      {/\d/.test(formData.password) ? '✓' : '○'} Có chữ số (0–9)
                    </li>
                    <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'ok' : ''}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '○'} Có ký tự đặc biệt (!@#$%...)
                    </li>
                  </ul>
                )}
              </div>

              {/* Xác nhận mật khẩu */}
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Xác nhận mật khẩu <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    id="confirmPassword" name="confirmPassword"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword} onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button" className="password-toggle"
                    onClick={() => setShowConfirmPw(v => !v)} tabIndex={-1}
                    aria-label="Hiện/ẩn xác nhận mật khẩu"
                  >
                    {showConfirmPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="invalid-feedback d-block">{errors.confirmPassword}</div>
                )}
                {formData.confirmPassword && !errors.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <div className="password-match">✅ Mật khẩu khớp</div>
                  )}
              </div>

              <button type="submit" className="btn-register" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Đang xử lý...
                  </>
                ) : '📧 Đăng Ký & Gửi OTP'}
              </button>
            </form>

            <div className="register-footer">
              <p>
                Đã có tài khoản?{' '}
                <Link to="/login" className="login-link">Đăng nhập ngay</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;