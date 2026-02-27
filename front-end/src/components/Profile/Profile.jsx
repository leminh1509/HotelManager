// src/components/Profile/Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './Profile.css';

const Profile = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const [infoForm, setInfoForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    mobilePhone: '',
    birthday: '',
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [pwErrors, setPwErrors] = useState({});
  const [infoErrors, setInfoErrors] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (stored) {
      setUser(stored);
      fetchProfile(stored.userId);
    }
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:9999/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setInfoForm({
          firstName: data.firstName || '',
          middleName: data.middleName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          mobilePhone: data.mobilePhone || '',
          birthday: data.birthday || '',
        });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // ── Avatar Upload ──────────────────────────────────────────
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showMessage('error', 'Only JPG, PNG, WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image must be under 5MB.');
      return;
    }

    setAvatarUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch(`http://localhost:9999/api/users/${user.userId}/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const updated = { ...user, avatarUrl: data.avatarUrl };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        window.dispatchEvent(new Event('auth:changed'));
        showMessage('success', 'Avatar updated successfully!');
      } else {
        showMessage('error', 'Failed to upload avatar.');
      }
    } catch {
      showMessage('error', 'Network error while uploading avatar.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Update Info ────────────────────────────────────────────
  const validateInfo = () => {
    const errors = {};
    if (!infoForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!infoForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (infoForm.mobilePhone && !/^[0-9]{10,20}$/.test(infoForm.mobilePhone))
      errors.mobilePhone = 'Phone must be 10-20 digits';
    setInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    if (!validateInfo()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:9999/api/users/${user.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: infoForm.firstName,
          middleName: infoForm.middleName,
          lastName: infoForm.lastName,
          mobilePhone: infoForm.mobilePhone,
          birthday: infoForm.birthday,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = { ...user, ...data };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        window.dispatchEvent(new Event('auth:changed'));
        showMessage('success', 'Profile updated successfully!');
      } else {
        const err = await res.json();
        showMessage('error', err.message || 'Update failed.');
      }
    } catch {
      showMessage('error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  // ── Change Password ────────────────────────────────────────
  const validatePw = () => {
    const errors = {};
    if (!pwForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!pwForm.newPassword) errors.newPassword = 'New password is required';
    else if (pwForm.newPassword.length < 6) errors.newPassword = 'At least 6 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';
    setPwErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (!validatePw()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:9999/api/users/${user.userId}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });

      if (res.ok) {
        showMessage('success', 'Password changed successfully!');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPwErrors({});
      } else {
        const err = await res.json();
        showMessage('error', err.message || 'Password change failed.');
      }
    } catch {
      showMessage('error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadge = (role) => {
    const map = {
      ADMIN: { label: 'Admin', color: '#ef4444' },
      RECEPTIONIST: { label: 'Receptionist', color: '#f59e0b' },
      MAINTENANCE: { label: 'Maintenance', color: '#3b82f6' },
      CUSTOMER: { label: 'Customer', color: '#10b981' },
    };
    return map[role] || { label: role, color: '#6b7280' };
  };

  return (
    <>
      <Header user={user} role={user?.role?.toLowerCase()} onLogout={onLogout} />

      <div className="profile-page">
        {/* Hero Banner */}
        <div className="profile-banner">
          <div className="profile-banner-overlay" />
          <div className="profile-banner-content">
            {/* Avatar */}
            <div className="avatar-wrapper">
              <div className="avatar-ring">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="avatar-img" />
                ) : (
                  <div className="avatar-initials">{getInitials()}</div>
                )}
              </div>
              <button
                className="avatar-edit-btn"
                onClick={handleAvatarClick}
                title="Change photo"
                disabled={avatarUploading}
              >
                {avatarUploading ? (
                  <span className="spin-icon">⟳</span>
                ) : (
                  <i className="fa fa-camera" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>

            {/* User Info */}
            <div className="profile-banner-info">
              <h1 className="profile-name">
                {user ? `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}` : 'Loading...'}
              </h1>
              <p className="profile-email">{user?.email}</p>
              {user?.role && (
                <span
                  className="role-badge"
                  style={{ background: getRoleBadge(user.role).color }}
                >
                  {getRoleBadge(user.role).label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="profile-content container">
          {/* Message Alert */}
          {message.text && (
            <div className={`profile-alert profile-alert--${message.type}`}>
              <i className={`fa ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
              {message.text}
            </div>
          )}

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <i className="fa fa-user" /> Personal Info
            </button>
            <button
              className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <i className="fa fa-lock" /> Change Password
            </button>
          </div>

          {/* Tab: Personal Info */}
          {activeTab === 'info' && (
            <div className="profile-card">
              <div className="profile-card-header">
                <h2><i className="fa fa-id-card" /> Personal Information</h2>
                <p>Update your personal details below</p>
              </div>

              <form onSubmit={handleInfoSubmit} className="profile-form">
                <div className="form-grid">
                  <div className="pf-group">
                    <label>First Name <span className="req">*</span></label>
                    <input
                      type="text"
                      className={`pf-input ${infoErrors.firstName ? 'error' : ''}`}
                      value={infoForm.firstName}
                      onChange={e => setInfoForm(p => ({ ...p, firstName: e.target.value }))}
                      placeholder="First name"
                    />
                    {infoErrors.firstName && <span className="pf-error">{infoErrors.firstName}</span>}
                  </div>

                  <div className="pf-group">
                    <label>Middle Name</label>
                    <input
                      type="text"
                      className="pf-input"
                      value={infoForm.middleName}
                      onChange={e => setInfoForm(p => ({ ...p, middleName: e.target.value }))}
                      placeholder="Middle name (optional)"
                    />
                  </div>

                  <div className="pf-group">
                    <label>Last Name <span className="req">*</span></label>
                    <input
                      type="text"
                      className={`pf-input ${infoErrors.lastName ? 'error' : ''}`}
                      value={infoForm.lastName}
                      onChange={e => setInfoForm(p => ({ ...p, lastName: e.target.value }))}
                      placeholder="Last name"
                    />
                    {infoErrors.lastName && <span className="pf-error">{infoErrors.lastName}</span>}
                  </div>

                  <div className="pf-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="pf-input pf-input--readonly"
                      value={infoForm.email}
                      readOnly
                    />
                    <span className="pf-hint"><i className="fa fa-lock" /> Email cannot be changed</span>
                  </div>

                  <div className="pf-group">
                    <label>Mobile Phone</label>
                    <input
                      type="tel"
                      className={`pf-input ${infoErrors.mobilePhone ? 'error' : ''}`}
                      value={infoForm.mobilePhone}
                      onChange={e => setInfoForm(p => ({ ...p, mobilePhone: e.target.value }))}
                      placeholder="0123456789"
                    />
                    {infoErrors.mobilePhone && <span className="pf-error">{infoErrors.mobilePhone}</span>}
                  </div>

                  <div className="pf-group">
                    <label>Birthday</label>
                    <input
                      type="date"
                      className="pf-input"
                      value={infoForm.birthday}
                      onChange={e => setInfoForm(p => ({ ...p, birthday: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? (
                      <><span className="btn-spinner" /> Saving...</>
                    ) : (
                      <><i className="fa fa-save" /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Change Password */}
          {activeTab === 'password' && (
            <div className="profile-card">
              <div className="profile-card-header">
                <h2><i className="fa fa-shield" /> Change Password</h2>
                <p>Keep your account secure with a strong password</p>
              </div>

              <form onSubmit={handlePwSubmit} className="profile-form">
                <div className="form-grid form-grid--single">
                  <div className="pf-group">
                    <label>Current Password <span className="req">*</span></label>
                    <input
                      type="password"
                      className={`pf-input ${pwErrors.currentPassword ? 'error' : ''}`}
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    {pwErrors.currentPassword && <span className="pf-error">{pwErrors.currentPassword}</span>}
                  </div>

                  <div className="pf-group">
                    <label>New Password <span className="req">*</span></label>
                    <input
                      type="password"
                      className={`pf-input ${pwErrors.newPassword ? 'error' : ''}`}
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                      placeholder="At least 6 characters"
                    />
                    {pwErrors.newPassword && <span className="pf-error">{pwErrors.newPassword}</span>}
                    {pwForm.newPassword && (
                      <div className="pw-strength">
                        <div className={`pw-bar ${
                          pwForm.newPassword.length >= 10 ? 'strong' :
                          pwForm.newPassword.length >= 6 ? 'medium' : 'weak'
                        }`} />
                        <span>{
                          pwForm.newPassword.length >= 10 ? 'Strong' :
                          pwForm.newPassword.length >= 6 ? 'Medium' : 'Weak'
                        }</span>
                      </div>
                    )}
                  </div>

                  <div className="pf-group">
                    <label>Confirm New Password <span className="req">*</span></label>
                    <input
                      type="password"
                      className={`pf-input ${pwErrors.confirmPassword ? 'error' : ''}`}
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Re-enter new password"
                    />
                    {pwErrors.confirmPassword && <span className="pf-error">{pwErrors.confirmPassword}</span>}
                    {pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword && (
                      <span className="pf-match"><i className="fa fa-check" /> Passwords match</span>
                    )}
                  </div>
                </div>

                <div className="pw-tips">
                  <p><i className="fa fa-info-circle" /> Password tips:</p>
                  <ul>
                    <li>At least 6 characters long</li>
                    <li>Mix uppercase, lowercase, numbers and symbols</li>
                    <li>Avoid using personal information</li>
                  </ul>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save btn-save--danger" disabled={loading}>
                    {loading ? (
                      <><span className="btn-spinner" /> Updating...</>
                    ) : (
                      <><i className="fa fa-key" /> Update Password</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Profile;