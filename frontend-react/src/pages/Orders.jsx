import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Check, CreditCard, Loader2, MapPin, Receipt, Smartphone, XCircle } from 'lucide-react';
import { Api, money } from '../api/client';

const STEPS = ['Confirmed', 'Shipped', 'Delivered'];
const stepIndex = { PENDING: 0, CONFIRMED: 0, SHIPPED: 1, DELIVERED: 2 };

const payIcon = { CARD: CreditCard, UPI: Smartphone, COD: Banknote };
const payLabel = { CARD: 'Card', UPI: 'UPI', COD: 'Cash on delivery' };
const payBadge = {
  SUCCESS: ['Paid', 'bg-emerald-100 text-emerald-800'],
  PENDING: ['Pay on delivery', 'bg-amber-100 text-amber-800'],
  REFUNDED: ['Refunded', 'bg-slate-200 text-slate-700'],
  FAILED: ['Failed', 'bg-red-100 text-red-800'],
};

function Tracker({ status }) {
  if (status === 'CANCELLED') {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-danger">
        <XCircle size={18} /> This order was cancelled
      </p>
    );
  }
  const current = stepIndex[status] ?? 0;
  return (
    <ol className="flex items-center">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              i <= current ? 'bg-pine text-white' : 'bg-paper-dim text-ink-soft'}`}>
              {i <= current ? <Check size={14} /> : i + 1}
            </span>
            <span className={`text-xs ${i <= current ? 'font-medium text-ink' : 'text-ink-soft'}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <span className={`mx-2 mb-5 h-0.5 flex-1 ${i < current ? 'bg-pine' : 'bg-line'}`} />}
        </li>
      ))}
    </ol>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Api.getOrders().then(setOrders).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-bold md:text-4xl">Your orders</h1>

      {error ? (
        <p className="mt-8 rounded-xl border border-danger/30 bg-red-50 p-6 text-center text-danger">{error}</p>
      ) : orders === null ? (
        <div className="py-24 text-center text-ink-soft"><Loader2 className="mx-auto animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center">
          <Receipt size={44} className="mx-auto mb-4 text-ink-soft/40" />
          <h2 className="text-xl font-semibold">No orders yet</h2>
          <p className="mb-6 mt-1 text-sm text-ink-soft">Your placed orders will show up here.</p>
          <Link to="/" className="btn-brass">Start shopping</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((o) => {
            const PayIcon = payIcon[o.paymentMethod] || CreditCard;
            const [payText, payCls] = payBadge[o.paymentStatus] || ['—', 'bg-paper-dim text-ink-soft'];
            return (
              <article key={o.id} className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-paper/60 px-6 py-4">
                  <div>
                    <p className="font-mono text-sm font-medium">Order #{o.id}</p>
                    <p className="text-xs text-ink-soft">{new Date(o.orderDate).toLocaleString()}</p>
                  </div>
                  <p className="font-mono text-lg font-semibold text-pine">{money(o.totalAmount)}</p>
                </header>

                <div className="border-b border-line px-6 py-5">
                  <Tracker status={o.status} />
                </div>

                <ul className="divide-y divide-line/70 px-6 py-2">
                  {o.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between py-2.5 text-sm">
                      <Link to={`/products/${i.productId}`} className="hover:text-pine">
                        <span className="font-mono text-ink-soft">{i.quantity}×</span> {i.productName}
                      </Link>
                      <span className="font-mono">{money(i.priceAtPurchase * i.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <footer className="grid gap-3 border-t border-line bg-paper/40 px-6 py-4 text-xs text-ink-soft sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5">
                      <PayIcon size={14} />
                      <span className="font-medium text-ink">{payLabel[o.paymentMethod] || 'Payment'}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${payCls}`}>{payText}</span>
                    </p>
                    {o.paymentInstrument && o.paymentMethod !== 'COD' && <p className="pl-5">{o.paymentInstrument}</p>}
                    {o.transactionId && <p className="pl-5 font-mono">Ref: {o.transactionId}</p>}
                  </div>
                  <p className="flex items-start gap-1.5 sm:justify-end"><MapPin size={14} className="mt-0.5 shrink-0" /> {o.shippingAddress}</p>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
