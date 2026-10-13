import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Phone, AlertCircle, CheckCircle2, RefreshCw, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  // Step 1: Input details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: OTP Verification
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [target, setTarget] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { initiateRegisterOtp, verifyRegisterOtp, resendRegisterOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const dispatchedTarget = await initiateRegisterOtp(fullName.trim(), email.trim(), password, phone.trim());
      setTarget(dispatchedTarget);
      setStep('otp');
      setCountdown(60);
      setCanResend(false);
      setSuccessMsg(`A 6-digit verification code was sent to ${dispatchedTarget}.`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await verifyRegisterOtp(target, otpCode.trim());
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await resendRegisterOtp(target);
      setCountdown(60);
      setCanResend(false);
      setSuccessMsg(`A fresh verification code has been dispatched to ${target}.`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
            {step === 'form' ? <User size={24} /> : <KeyRound size={24} />}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            {step === 'form' ? 'Create Customer Account' : 'Verify Your Email'}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            {step === 'form'
              ? 'Join our retail community with OTP security verification'
              : `Enter the 6-digit verification code dispatched to ${target}`}
          </p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleInitiate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
                <User size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Phone Number (Optional)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                />
                <Phone size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '0.5rem 2rem 0.5rem 2rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                  />
                  <Lock size={15} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '0.375rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '0.2rem',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Confirm *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '0.5rem 2rem 0.5rem 2rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                  />
                  <Lock size={15} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '0.375rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '0.2rem',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              {loading ? 'Sending Verification Code...' : 'Continue to Verification →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#334155' }}>
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                style={{
                  width: '200px',
                  margin: '0 auto',
                  textAlign: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  letterSpacing: '8px',
                  padding: '0.5rem',
                  border: '2px solid #3b82f6',
                  borderRadius: '0.5rem',
                  outline: 'none',
                }}
              />
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                Check your inbox (or backend dev logs if SMTP credentials are blank).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
            >
              {loading ? 'Verifying Code...' : 'Verify & Complete Sign In'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setStep('form')}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: canResend ? '#2563eb' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: canResend ? 'pointer' : 'not-allowed',
                }}
              >
                <RefreshCw size={14} />
                {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
