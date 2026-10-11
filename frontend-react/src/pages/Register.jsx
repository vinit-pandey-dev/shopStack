import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.username.trim(), form.email.trim(), form.password);
      toast('Account created — please log in');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-5 py-16">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-card">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mb-7 mt-1 text-sm text-ink-soft">Join ShopStack to start shopping.</p>

        {error && (
          <div className="mb-5 rounded-md border border-danger/40 bg-red-50 px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input id="username" className="input" required minLength={3} maxLength={50} autoFocus
              value={form.username} onChange={set('username')} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" required value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" required minLength={6}
              value={form.password} onChange={set('password')} />
            <p className="mt-1.5 text-xs text-ink-soft">At least 6 characters.</p>
          </div>
          <button type="submit" disabled={busy} className="btn-brass w-full">
            {busy && <Loader2 size={16} className="animate-spin" />} Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account? <Link to="/login" className="font-semibold text-pine hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
