import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Store,
  ChevronRight,
  X
} from 'lucide-react';
import { CustomerFeedback, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';

export const FeedbackAdminPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedback | null>(null);

  const fetchFeedback = () => {
    setLoading(true);
    apiClient
      .get<ApiResponse<CustomerFeedback[]>>('/feedback')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setFeedbacks(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load customer feedback:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // Filtered feedback
  const filteredFeedbacks = feedbacks.filter((item) => {
    const matchesCategory =
      selectedCategory === 'ALL' || item.category.toLowerCase() === selectedCategory.toLowerCase();

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      item.fullName.toLowerCase().includes(searchLower) ||
      item.email.toLowerCase().includes(searchLower) ||
      item.subject.toLowerCase().includes(searchLower) ||
      item.message.toLowerCase().includes(searchLower) ||
      (item.phone && item.phone.toLowerCase().includes(searchLower));

    return matchesCategory && matchesSearch;
  });

  // Analytics counts
  const totalCount = feedbacks.length;
  const suggestionsCount = feedbacks.filter((f) => f.category.toLowerCase() === 'suggestion').length;
  const inquiriesCount = feedbacks.filter((f) => f.category.toLowerCase() === 'inquiry').length;
  const complaintsCount = feedbacks.filter((f) => f.category.toLowerCase() === 'complaint').length;
  const inStoreCount = feedbacks.filter((f) => f.category.toLowerCase() === 'instoreexperience').length;

  const getCategoryBadge = (category: string) => {
    const cat = category.toLowerCase();
    if (cat === 'suggestion') {
      return (
        <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <Sparkles size={12} /> Suggestion
        </span>
      );
    }
    if (cat === 'complaint') {
      return (
        <span style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <AlertTriangle size={12} /> Complaint
        </span>
      );
    }
    if (cat === 'inquiry') {
      return (
        <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <HelpCircle size={12} /> Inquiry
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <Store size={12} /> In-Store
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={26} color="#2563eb" /> Customer Feedback & Suggestions
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Review customer opinions, store feedback, product suggestions, and complaints submitted online.
          </p>
        </div>

        <button
          onClick={fetchFeedback}
          disabled={loading}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Submissions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{totalCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Suggestions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{suggestionsCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HelpCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Inquiries</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8' }}>{inquiriesCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Complaints</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{complaintsCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search feedback by customer, email, subject, keyword..."
              style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#64748b" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
          >
            <option value="ALL">All Categories ({totalCount})</option>
            <option value="Suggestion">Suggestions ({suggestionsCount})</option>
            <option value="Inquiry">Inquiries ({inquiriesCount})</option>
            <option value="Complaint">Complaints ({complaintsCount})</option>
            <option value="InStoreExperience">In-Store Experience ({inStoreCount})</option>
          </select>
        </div>
      </div>

      {/* Feed List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#2563eb' }} />
            <p style={{ margin: 0 }}>Loading customer feedback records...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', color: '#cbd5e1' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>No feedback found</h3>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              {searchTerm || selectedCategory !== 'ALL'
                ? 'Try adjusting your search terms or filter selection.'
                : 'Customer feedback submissions from your storefront will appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredFeedbacks.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedFeedback(item)}
                style={{
                  padding: '1.25rem',
                  borderBottom: idx === filteredFeedbacks.length - 1 ? 'none' : '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                  {/* Avatar Initials */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: '#e0e7ff',
                      color: '#3730a3',
                      fontWeight: 800,
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.fullName ? item.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>{item.fullName}</span>
                      {getCategoryBadge(item.category)}
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} /> {new Date(item.createdAtUtc).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      {item.subject}
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8125rem',
                        color: '#475569',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Mail size={12} /> {item.email}
                      </span>
                      {item.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Phone size={12} /> {item.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ alignSelf: 'center', color: '#94a3b8' }}>
                  <ChevronRight size={18} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Feedback Modal */}
      {selectedFeedback && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1.5rem',
          }}
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ marginBottom: '0.35rem' }}>{getCategoryBadge(selectedFeedback.category)}</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {selectedFeedback.subject}
                </h2>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Details Box */}
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '0.5rem', padding: '0.875rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Submitted By</span>
                  <strong style={{ color: '#0f172a' }}>{selectedFeedback.fullName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Date & Time</span>
                  <span style={{ color: '#0f172a' }}>{new Date(selectedFeedback.createdAtUtc).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Email</span>
                  <a href={`mailto:${selectedFeedback.email}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                    {selectedFeedback.email}
                  </a>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Phone</span>
                  <span style={{ color: '#0f172a' }}>{selectedFeedback.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Feedback Message */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                Customer Message
              </label>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedFeedback.message}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <a
                href={`mailto:${selectedFeedback.email}?subject=${encodeURIComponent('Regarding your feedback: ' + selectedFeedback.subject)}`}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <Mail size={16} /> Reply via Email
              </a>
              <button onClick={() => setSelectedFeedback(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
