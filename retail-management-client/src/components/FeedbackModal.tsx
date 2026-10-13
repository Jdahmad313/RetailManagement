import React, { useState } from 'react';
import { X, MessageSquarePlus, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await apiClient.post<ApiResponse<any>>('/feedback', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        category,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <div className="card" style={{ width: '100%', maxWidth: 500, padding: '1.75rem', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '1rem',
            top: '1rem',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquarePlus size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>Feedback & Suggestions</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Help us enhance your shopping experience</p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.625rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#065f46' }}>Thank You!</h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>Your feedback has been delivered to management.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Your Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
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
                  placeholder="john@example.com"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Phone (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
                >
                  <option value="Suggestion">💡 Product / Feature Suggestion</option>
                  <option value="Inquiry">❓ General Inquiry</option>
                  <option value="Complaint">⚠️ Service Complaint</option>
                  <option value="InStoreExperience">🏬 In-Store POS Experience</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your feedback..."
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Your Message *</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your suggestions or experience in detail..."
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', gap: '0.375rem' }}>
                <Send size={15} /> {loading ? 'Submitting...' : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
