import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Banknote, CreditCard, Loader2, Lock, ShoppingBag, Smartphone } from 'lucide-react';
import { Api, money } from '../api/client';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';

const METHODS = [
  { id: 'CARD', label: 'Card', hint: 'Credit / debit card', icon: CreditCard },
  { id: 'UPI', label: 'UPI', hint: 'Pay with any UPI app', icon: Smartphone },
  { id: 'COD', label: 'Cash on delivery', hint: 'Pay when it arrives', icon: Banknote },
];

const groupCard = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
const maskExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const UPI_RE = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

function validate(method, address, card, upi) {
  if (!address.trim()) return 'Please enter a shipping address.';
  if (method === 'CARD') {
    const digits = card.number.replace(/\D/g, '');
    if (digits.length < 13) return 'Enter a valid card number.';
    if (!card.name.trim()) return 'Enter the name on the card.';
    const m = card.expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12) return 'Enter the expiry as MM/YY.';
    const expiresAt = new Date(2000 + +m[2], +m[1], 1); // first day of the month AFTER expiry
    if (expiresAt <= new Date()) return 'This card has expired.';
    if (!/^\d{3,4}$/.test(card.cvv)) return 'Enter the 3 or 4 digit CVV.';
  }
  if (method === 'UPI' && !UPI_RE.test(upi.trim())) return 'Enter a valid UPI ID, like name@bank.';
  return '';
}

export default function Checkout() {
  const { items, total, loading, refresh: refreshCart } = useCart();
  const { refresh: refreshNotifications } = useNotifications();
  const toast = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [method, setMethod] = useState('CARD');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upi, setUpi] = useState('');
  const [error, setError] = useState(null); // { title, text }
  const [busy, setBusy] = useState(false);

  const fillCard = (number) => setCard({ number: groupCard(number), name: 'Test User', expiry: '12/34', cvv: '123' });

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate(method, address, card, upi);
    if (problem) {
      setError({ title: 'Check your details', text: problem });
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // Only what the API needs is sent. Expiry / CVV / name stay in the browser.
      await Api.placeOrder({
        shippingAddress: address.trim(),
        paymentMethod: method,
        cardNumber: method === 'CARD' ? card.number.replace(/\D/g, '') : undefined,
        upiId: method === 'UPI' ? upi.trim() : undefined,
      });
      await Promise.all([refreshCart(), refreshNotifications()]);
      toast(method === 'COD' ? 'Order placed!' : 'Payment successful — order placed!');
      navigate('/orders');
    } catch (err) {
      setError(
        err.status === 402
          ? { title: 'Payment declined', text: `${err.message}. You haven't been charged — try another method.` }
          : { title: "Couldn't place your order", text: err.message }
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading && items.length === 0) {
    return <div className="py-32 text-center text-ink-soft"><Loader2 className="mx-auto animate-spin" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <ShoppingBag size={44} className="mx-auto mb-4 text-ink-soft/40" />
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <p className="mb-6 mt-2 text-sm text-ink-soft">Your cart is empty.</p>
        <Link to="/" className="btn-brass">Continue shopping</Link>
      </div>
    );
  }

  const set = (k) => (e) => setCard({ ...card, [k]: e.target.value });

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-bold md:text-4xl">Checkout</h1>

      <form onSubmit={submit} className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {error && (
            <div role="alert" className="flex gap-3 rounded-xl border border-danger/40 bg-red-50 p-4 text-danger">
              <AlertTriangle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{error.title}</p>
                <p className="text-sm">{error.text}</p>
              </div>
            </div>
          )}

          {/* 1. Shipping */}
          <section className="rounded-xl border border-line bg-white p-6 shadow-card">
            <h2 className="mb-4 text-xl font-semibold"><span className="mr-2 font-mono text-brass">1</span>Shipping address</h2>
            <textarea rows={3} className="input resize-none" placeholder="Name, street, city, PIN code"
              value={address} onChange={(e) => setAddress(e.target.value)} />
          </section>

          {/* 2. Payment */}
          <section className="rounded-xl border border-line bg-white p-6 shadow-card">
            <h2 className="mb-4 text-xl font-semibold"><span className="mr-2 font-mono text-brass">2</span>Payment method</h2>

            <div className="grid gap-3 sm:grid-cols-3">
              {METHODS.map(({ id, label, hint, icon: Icon }) => (
                <button type="button" key={id} onClick={() => { setMethod(id); setError(null); }}
                  className={`rounded-lg border p-4 text-left transition ${
                    method === id ? 'border-pine bg-pine/5 ring-2 ring-pine' : 'border-line hover:border-pine/50'
                  }`}>
                  <Icon size={22} className={method === id ? 'text-pine' : 'text-ink-soft'} />
                  <p className="mt-2 text-sm font-semibold">{label}</p>
                  <p className="text-xs text-ink-soft">{hint}</p>
                </button>
              ))}
            </div>

            {method === 'CARD' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="label">Card number</label>
                  <input className="input font-mono" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242"
                    value={card.number} onChange={(e) => setCard({ ...card, number: groupCard(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Name on card</label>
                  <input className="input" autoComplete="cc-name" value={card.name} onChange={set('name')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Expiry</label>
                    <input className="input font-mono" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY"
                      value={card.expiry} onChange={(e) => setCard({ ...card, expiry: maskExpiry(e.target.value) })} />
                  </div>
                  <div>
                    <label className="label">CVV</label>
                    <input className="input font-mono" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4}
                      value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} />
                  </div>
                </div>
                <div className="rounded-lg bg-paper p-3 text-xs text-ink-soft">
                  <span className="font-semibold text-ink">Demo mode — no real money moves.</span> Try{' '}
                  <button type="button" onClick={() => fillCard('4242424242424242')} className="font-mono font-semibold text-pine underline">4242 4242 4242 4242</button>{' '}
                  (approved) or{' '}
                  <button type="button" onClick={() => fillCard('4000000000000002')} className="font-mono font-semibold text-danger underline">4000 0000 0000 0002</button>{' '}
                  (declined).
                </div>
              </div>
            )}

            {method === 'UPI' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="label">UPI ID</label>
                  <input className="input" placeholder="yourname@bank" value={upi} onChange={(e) => setUpi(e.target.value)} />
                </div>
                <div className="rounded-lg bg-paper p-3 text-xs text-ink-soft">
                  <span className="font-semibold text-ink">Demo mode.</span> Any ID like <span className="font-mono">name@upi</span> is approved;
                  one starting with <span className="font-mono">fail</span> (e.g. <span className="font-mono">fail@upi</span>) is declined.
                </div>
              </div>
            )}

            {method === 'COD' && (
              <p className="mt-6 rounded-lg bg-paper p-4 text-sm text-ink-soft">
                You'll pay in cash when your order is delivered. The order is confirmed right away.
              </p>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="sticky top-24 rounded-xl border border-line bg-white p-6 shadow-card">
          <h2 className="mb-4 text-xl font-semibold">Order summary</h2>
          <ul className="max-h-64 space-y-3 overflow-y-auto pr-1 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-ink-soft"><span className="font-mono">{i.quantity}×</span> {i.productName}</span>
                <span className="font-mono">{money(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="font-medium text-pine">Free</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd className="font-mono text-xl">{money(total)}</dd></div>
          </dl>

          <button type="submit" disabled={busy} className="btn-brass mt-6 w-full !py-3.5 text-base">
            {busy ? <><Loader2 size={18} className="animate-spin" /> Processing payment…</>
              : method === 'COD' ? 'Place order' : <><Lock size={16} /> Pay {money(total)}</>}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
            <Lock size={12} /> Card details are never stored
          </p>
          <Link to="/cart" className="mt-4 block text-center text-sm text-ink-soft hover:text-pine">← Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
