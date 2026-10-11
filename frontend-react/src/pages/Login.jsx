import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.username.trim(), form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (username, password) => setForm({ username, password });

  return (
    <div className="mx-auto w-full max-w-md px-5 py-16">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-card">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mb-7 mt-1 text-sm text-ink-soft">Log in to your ShopStack account.</p>

        {error && (
          <div className="mb-5 rounded-md border border-danger/40 bg-red-50 px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input id="username" className="input" required autoFocus value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" disabled={busy} className="btn-brass w-full">
            {busy && <Loader2 size={16} className="animate-spin" />} Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          New here? <Link to="/register" className="font-semibold text-pine hover:underline">Create an account</Link>
        </p>

        <div className="mt-6 rounded-lg bg-paper p-4 text-xs text-ink-soft">
          <p className="mb-2 font-semibold uppercase tracking-wider text-ink">Demo accounts</p>
          <button type="button" onClick={() => fillDemo('john', 'password123')} className="block font-mono hover:text-pine">
            john / password123 <span className="font-sans text-ink-soft/70">(user)</span>
          </button>
          <button type="button" onClick={() => fillDemo('admin', 'admin123')} className="mt-1 block font-mono hover:text-pine">
            admin / admin123 <span className="font-sans text-ink-soft/70">(admin)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
