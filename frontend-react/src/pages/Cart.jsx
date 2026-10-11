import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Loader2, ImageOff, ArrowRight } from 'lucide-react';
import { money } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Cart() {
  const { items, loading, total, setQuantity, removeItem } = useCart();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);

  const guard = async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-bold md:text-4xl">Your cart</h1>

      {loading && items.length === 0 ? (
        <div className="py-24 text-center text-ink-soft"><Loader2 className="mx-auto animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center">
          <ShoppingBag size={44} className="mx-auto mb-4 text-ink-soft/40" />
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="mb-6 mt-1 text-sm text-ink-soft">Browse the catalog and add something you like.</p>
          <Link to="/" className="btn-brass">Continue shopping</Link>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-card">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 p-5">
                <Link to={`/products/${item.productId}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-paper-dim">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-soft/40"><ImageOff size={24} /></div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/products/${item.productId}`} className="font-semibold hover:text-pine">{item.productName}</Link>
                      <p className="font-mono text-sm text-ink-soft">{money(item.price)} each</p>
                    </div>
                    <p className="font-mono text-lg font-semibold text-pine">{money(item.subtotal)}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-md border border-line">
                      <button disabled={busyId === item.id}
                        onClick={() => guard(item.id, () => setQuantity(item, item.quantity - 1))}
                        className="px-2.5 py-1.5 text-ink-soft transition hover:bg-paper-dim disabled:opacity-40" aria-label="Decrease quantity">
                        <Minus size={14} />
                      </button>
                      <span className="w-9 text-center font-mono text-sm">{item.quantity}</span>
                      <button disabled={busyId === item.id}
                        onClick={() => guard(item.id, () => setQuantity(item, item.quantity + 1))}
                        className="px-2.5 py-1.5 text-ink-soft transition hover:bg-paper-dim disabled:opacity-40" aria-label="Increase quantity">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => guard(item.id, () => removeItem(item.id))}
                      className="inline-flex items-center gap-1.5 text-sm text-danger transition hover:underline">
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="sticky top-24 rounded-xl border border-line bg-white p-6 shadow-card">
            <h2 className="mb-5 text-xl font-semibold">Order summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-mono">{money(total)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="font-medium text-pine">Free</dd></div>
              <div className="flex justify-between border-t border-line pt-4 text-base font-semibold">
                <dt>Total</dt><dd className="font-mono text-lg">{money(total)}</dd>
              </div>
            </dl>
            <Link to="/checkout" className="btn-brass mt-6 w-full !py-3">
              Proceed to checkout <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
