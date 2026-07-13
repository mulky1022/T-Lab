import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { loginUser } from '../lib/auth';
import { Role } from '../types';

const roles: Role[] = ['Administrator', 'Project Manager', 'Team Member'];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('Administrator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginUser({ email, password, role });
      toast.success(data.message || 'Signed in successfully.');
      router.push(role === 'Administrator' ? '/dashboard' : role === 'Project Manager' ? '/dashboard' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
      toast.error(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Secure sign in to your workspace"
      footer={
        <div className="space-y-3">
          <p className="text-sm text-secondary text-center">
            Need an account?{' '}
            <button onClick={() => router.push('/register')} className="text-accent font-medium hover:underline">Create one</button>
          </p>
          <p className="text-sm text-secondary text-center">
            Forgot your password?{' '}
            <button onClick={() => router.push('/forgot-password')} className="text-accent font-medium hover:underline">Reset it</button>
          </p>
        </div>
      }
    >
      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500 mb-4">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />

        <div className="relative">
          <Input label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-9 text-secondary">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div>
          <span className="block text-sm font-medium text-secondary mb-2">Access level</span>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((roleOption) => (
              <button
                key={roleOption}
                type="button"
                onClick={() => setRole(roleOption)}
                className={role === roleOption ? 'text-xs font-medium rounded-xl px-2 py-2.5 bg-accent text-black' : 'text-xs font-medium rounded-xl px-2 py-2.5 bg-bg border border-line text-secondary hover:border-accent'}
              >
                {roleOption === 'Project Manager' ? 'Project Manager' : roleOption === 'Team Member' ? 'Team Member' : 'Administrator'}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in</> : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
