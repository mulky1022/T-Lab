import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { requestForgotOtp, verifyForgotOtp, resetPassword } from '../lib/auth';

const passwordChecks = [
  { label: 'Minimum 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'Uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Number', test: (value: string) => /\d/.test(value) },
  { label: 'Special character', test: (value: string) => /[^A-Za-z\d]/.test(value) },
];

function getPasswordStrength(value: string) {
  const score = passwordChecks.filter(({ test }) => test(value)).length;
  if (!value) return { label: '', score: 0 };
  if (score <= 1) return { label: 'Weak', score };
  if (score <= 2) return { label: 'Fair', score };
  if (score <= 3) return { label: 'Good', score };
  if (score <= 4) return { label: 'Strong', score };
  return { label: 'Very Strong', score };
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = passwordConfirmation.length > 0 && password === passwordConfirmation;

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await requestForgotOtp({ email });
      toast.success('If an account exists, a verification code has been sent.');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset code.');
      toast.error(err instanceof Error ? err.message : 'Unable to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyForgotOtp({ email, code, type: 'password_reset' });
      toast.success('OTP verified. Create your new password.');
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify OTP.');
      toast.error(err instanceof Error ? err.message : 'Unable to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await resetPassword({ email, password, password_confirmation: passwordConfirmation });
      toast.success('Password updated. Please sign in again.');
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
      toast.error(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Securely recover access to your account"
      footer={
        <p className="text-sm text-secondary text-center">
          Remembered it?{' '}
          <button onClick={() => router.push('/login')} className="text-accent font-medium hover:underline">Back to sign in</button>
        </p>
      }
    >
      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500 mb-4">{error}</div> : null}

      {step === 'email' ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending code</> : 'Send verification code'}
          </Button>
        </form>
      ) : null}

      {step === 'otp' ? (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <Input label="Verification code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying</> : 'Verify code'}
          </Button>
        </form>
      ) : null}

      {step === 'reset' ? (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="relative">
            <Input label="New password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-9 text-secondary">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="rounded-xl border border-line p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Password strength</span>
              <span className="font-medium text-maintext">{strength.label || 'Enter a password'}</span>
            </div>
            <div className="h-2 rounded-full bg-bg overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(strength.score / 5) * 100}%` }} />
            </div>
            <ul className="space-y-1 text-xs text-secondary">
              {passwordChecks.map((check) => {
                const passed = check.test(password);
                return <li key={check.label} className={passed ? 'text-emerald-500' : 'text-secondary'}>{passed ? '✓' : '•'} {check.label}</li>;
              })}
            </ul>
          </div>

          <Input label="Confirm new password" type={showPassword ? 'text' : 'password'} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} autoComplete="new-password" required />
          {passwordConfirmation ? <p className={`text-xs ${passwordsMatch ? 'text-emerald-500' : 'text-red-500'}`}>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</p> : null}

          <Button type="submit" className="w-full" size="lg" disabled={loading || strength.score < 5 || !passwordsMatch}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving</> : 'Save new password'}
          </Button>
        </form>
      ) : null}
    </AuthShell>
  );
}
