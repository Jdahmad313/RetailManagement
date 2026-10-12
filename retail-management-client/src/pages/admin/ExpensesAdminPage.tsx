import React, { useEffect, useState } from 'react';
import { Plus, Receipt, Trash2, X, AlertCircle } from 'lucide-react';
import { Expense, ExpenseCategory, PagedResponse, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';

export const ExpensesAdminPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<number>(0); // 0=Cash, 1=Card, 2=Bank
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadExpenses = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.append('categoryId', selectedCategory);
    params.append('pageSize', '50');

    Promise.all([
      apiClient.get<ApiResponse<PagedResponse<Expense>>>(`/expenses?${params.toString()}`),
      apiClient.get<ApiResponse<ExpenseCategory[]>>('/expenses/categories'),
    ])
      .then(([expRes, catRes]) => {
        if (expRes.data.success && expRes.data.data) {
          setExpenses(expRes.data.data.items);
        }
        if (catRes.data.success) {
          setCategories(catRes.data.data);
          if (!categoryId && catRes.data.data.length > 0) {
            setCategoryId(catRes.data.data[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      expenseCategoryId: categoryId,
      title: title.trim(),
      amount,
      paymentMethod,
      description: description.trim() || null,
      receiptAttachmentUrl: receiptUrl.trim() || null,
    };

    try {
      await apiClient.post('/expenses', payload);
      setShowModal(false);
      setTitle('');
      setAmount(0);
      setDescription('');
      setReceiptUrl('');
      loadExpenses();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to record expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      loadExpenses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete expense.');
    }
  };

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Expense Management</h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Track operational costs, rent, utilities, payroll, and supplies</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Record Expense
        </button>
      </div>

      {/* Category Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {categories.map((c) => (
          <div key={c.id} className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{c.name}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
              ${c.totalAmount.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{c.expenseCount} entries</div>
          </div>
        ))}
      </div>

      {/* Filter and Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
            Total In View: <span style={{ color: '#dc2626' }}>${totalExpenses.toFixed(2)}</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '0.75rem 1.25rem' }}>Date</th>
              <th style={{ padding: '0.75rem 1rem' }}>Title & Description</th>
              <th style={{ padding: '0.75rem 1rem' }}>Category</th>
              <th style={{ padding: '0.75rem 1rem' }}>Method</th>
              <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
              <th style={{ padding: '0.75rem 1rem' }}>Recorded By</th>
              <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading expenses...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No expenses recorded.</td></tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1.25rem', color: '#64748b' }}>
                    {new Date(e.expenseDateUtc).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{e.title}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{e.description || 'No notes'}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="badge badge-info">{e.categoryName}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                    {e.paymentMethod === 0 ? 'Cash' : e.paymentMethod === 1 ? 'Card' : 'Bank Transfer'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#dc2626' }}>
                    ${e.amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                    {e.recordedByUserName || 'Admin'}
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                    <button onClick={() => handleDeleteExpense(e.id)} style={{ color: '#ef4444' }} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Record Business Expense</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Expense Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. Electricity bill, Staff lunch, Thermal rolls"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(parseInt(e.target.value, 10))}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  >
                    <option value={0}>Cash</option>
                    <option value={1}>Card</option>
                    <option value={2}>Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
