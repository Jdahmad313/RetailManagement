import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, Mail, Shield, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../../api/client';
import { User, ApiResponse } from '../../types';

export const StaffAdminPage: React.FC = () => {
  const [cashiers, setCashiers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchCashiers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<User[]>>('/auth/cashiers');
      if (res.data.success) {
        setCashiers(res.data.data);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post<ApiResponse<User>>('/auth/cashiers/invite', {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phone.trim() || null,
        password: password.trim(),
      });
      if (res.data.success) {
        setSuccessMsg(`Cashier account created! An invitation email has been sent to ${email}.`);
        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('');
        fetchCashiers();
        setTimeout(() => {
          setModalOpen(false);
          setSuccessMsg(null);
        }, 2500);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create cashier account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to revoke cashier access for ${name}?`)) return;
    try {
      await apiClient.delete(`/auth/cashiers/${id}`);
      setCashiers((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete cashier.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Cashier & Staff Management</h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Only administrators can create Cashier accounts and send them official POS login invitations
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <UserPlus size={16} /> Create & Invite Cashier
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-container">
          <table style={{ width: '100%', minWidth: 650, borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Staff Member</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Phone</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569' }}>Assigned Role</th>
                <th className="sticky-action-header" style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading staff accounts...
                  </td>
                </tr>
              ) : cashiers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No dedicated cashiers found. Click "Create & Invite Cashier" to add in-store store staff.
                  </td>
                </tr>
              ) : (
                cashiers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '9999px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {c.fullName.charAt(0)}
                        </div>
                        <span>{c.fullName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{c.email}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{c.phoneNumber || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="badge badge-info" style={{ gap: '0.25rem' }}>
                        <Shield size={12} /> Cashier
                      </span>
                    </td>
                    <td className="sticky-action-col" style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleDelete(c.id, c.fullName)}
                        style={{ color: '#ef4444', padding: '0.35rem', borderRadius: '0.25rem' }}
                        title="Revoke access"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
          backdropFilter: 'blur(3px)',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>Invite In-Store Cashier</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Generates credentials and dispatches official invitation email</p>
              </div>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.625rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={15} /> {errorMsg}
              </div>
            )}

            {successMsg ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <CheckCircle2 size={44} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#065f46' }}>Invitation Dispatched</h4>
                <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Cashier Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Michael Smith"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. michael@retail.local"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Initial Temporary Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters (e.g. Cashier@123)"
                      style={{ width: '100%', padding: '0.5rem 2.25rem 0.5rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.25rem' }}
                  >
                    {submitting ? 'Creating & Sending...' : 'Dispatch Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
