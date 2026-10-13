import React, { useState } from 'react';
import { User as UserIcon, Lock, Mail, Phone, Shield, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);
    try {
      await updateProfile(fullName.trim(), phoneNumber.trim());
      setProfileSuccess('Profile information updated successfully!');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully! Keep your credentials safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Account Settings</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Manage your personal profile details and update your account security credentials.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Personal Details Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Personal Profile</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Your personal contact and identification details</span>
            </div>
          </div>

          {profileError && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.625rem', borderRadius: '0.375rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <AlertCircle size={15} /> {profileError}
            </div>
          )}

          {profileSuccess && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.625rem', borderRadius: '0.375rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <CheckCircle2 size={15} /> {profileSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Registered Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Email cannot be changed after registration.</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
                <UserIcon size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0300-1234567"
                  style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
                <Phone size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} color="#64748b" />
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Role Permissions: <strong style={{ color: '#0f172a' }}>{user?.roles?.join(', ') || 'Customer'}</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="btn btn-primary"
              style={{ padding: '0.625rem', justifyContent: 'center', marginTop: '0.25rem' }}
            >
              {profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.5rem', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Security & Password</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Change your login credentials</span>
            </div>
          </div>

          {passwordError && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.625rem', borderRadius: '0.375rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <AlertCircle size={15} /> {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.625rem', borderRadius: '0.375rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <CheckCircle2 size={15} /> {passwordSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '0.5rem 2.5rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.625rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  style={{ width: '100%', padding: '0.5rem 2.5rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.625rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  style={{ width: '100%', padding: '0.5rem 2.5rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.625rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn btn-primary"
              style={{ padding: '0.625rem', justifyContent: 'center', marginTop: '0.25rem' }}
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
