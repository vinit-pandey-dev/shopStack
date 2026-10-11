import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ImageOff, Loader2, Minus, Plus, ShieldCheck, ShoppingCart, Truck, Wallet, Zap } from 'lucide-react';
import { Api, money } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(null); // 'add' | 'buy'
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    setLoading(true);
    setError('');
    setQty(1);
    setImgFailed(false);

    Promise.all([Api.getProduct(id), Api.getRelated(id).catch(() => [])])
      .then(([p, r]) => {
        if (cancelled) return;
        setProduct(p);
        setRelated(r);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl animate-pulse px-5 py-10">
        <div className="mb-8 h-4 w-64 rounded bg-paper-dim" />
        <div className="grid gap-10 md:grid-cols-2">
          <div className="aspect-square rounded-2xl bg-paper-dim" />
          <div className="space-y-4">
            <div className="h-5 w-24 rounded bg-paper-dim" />
            <div className="h-10 w-3/4 rounded bg-paper-dim" />
            <div className="h-8 w-32 rounded bg-paper-dim" />
            <div className="h-24 w-full rounded bg-paper-dim" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mb-6 mt-2 text-sm text-ink-soft">{error || "We couldn't find that product."}</p>
        <Link to="/" className="btn-brass">Back to shop</Link>
      </div>
    );
  }

  const out = product.stock === 0;
  const low = product.stock > 0 && product.stock <= 5;
  const maxQty = Math.min(product.stock, 10);

  const add = async (buyNow = false) => {
    if (!isLoggedIn) {
      toast('Log in to continue', 'error');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    setBusy(buyNow ? 'buy' : 'add');
    try {
      await addItem(product.id, qty);
      if (buyNow) navigate('/checkout');
      else toast(`${qty} × ${product.name} added to cart`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const details = [
    ['Category', product.categoryName || '—'],
    ['SKU', `SS-${String(product.id).padStart(5, '0')}`],
    ['Availability', out ? 'Out of stock' : `${product.stock} units in stock`],
    ['Shipping', 'Free, ships within 2 business days'],
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        <Link to="/" className="hover:text-pine">Shop</Link>
        {product.categoryName && (
          <>
            <ChevronRight size={14} />
            <span>{product.categoryName}</span>
          </>
        )}
        <ChevronRight size={14} />
        <span className="font-medium text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 lg:gap-14">
        {/* Image */}
        <div className="self-start overflow-hidden rounded-2xl border border-line bg-white shadow-card md:sticky md:top-24">
          <div className="aspect-square bg-paper-dim">
            {product.imageUrl && !imgFailed ? (
              <img src={product.imageUrl} alt={product.name} onError={() => setImgFailed(true)} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-soft/40"><ImageOff size={56} /></div>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          {product.categoryName && (
            <span className="rounded-full bg-paper-dim px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-pine">
              {product.categoryName}
            </span>
          )}
          <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{product.name}</h1>

          <p className="mt-5 font-mono text-4xl font-semibold text-pine">{money(product.price)}</p>
          <p className="mt-1 text-xs text-ink-soft">Inclusive of all taxes · Free shipping</p>

          <div className="mt-4">
            {out ? (
              <span className="rounded-md bg-red-50 px-2.5 py-1 text-sm font-semibold text-danger">Out of stock</span>
            ) : low ? (
              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">Only {product.stock} left — order soon</span>
            ) : (
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">In stock</span>
            )}
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <h2 className="mb-2 text-lg font-semibold">About this item</h2>
            <p className="leading-relaxed text-ink-soft">{product.description || 'No description available for this product yet.'}</p>
          </div>

          {/* Quantity + actions */}
          {!out && (
            <div className="mt-7 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-ink-soft">Quantity</span>
                <div className="inline-flex items-center rounded-md border border-line bg-white">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}
                    className="px-3 py-2 text-ink-soft transition hover:bg-paper-dim disabled:opacity-40" aria-label="Decrease">
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-mono">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}
                    className="px-3 py-2 text-ink-soft transition hover:bg-paper-dim disabled:opacity-40" aria-label="Increase">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={() => add(false)} disabled={busy !== null} className="btn-outline flex-1 !py-3">
                  {busy === 'add' ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />} Add to cart
                </button>
                <button onClick={() => add(true)} disabled={busy !== null} className="btn-brass flex-1 !py-3">
                  {busy === 'buy' ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Buy now
                </button>
              </div>
            </div>
          )}

          {/* Trust row */}
          <ul className="mt-7 grid gap-3 rounded-xl bg-white p-4 text-sm text-ink-soft ring-1 ring-line sm:grid-cols-3">
            <li className="flex items-center gap-2"><Truck size={17} className="text-pine" /> Free delivery</li>
            <li className="flex items-center gap-2"><ShieldCheck size={17} className="text-pine" /> Secure payment</li>
            <li className="flex items-center gap-2"><Wallet size={17} className="text-pine" /> Pay on delivery</li>
          </ul>

          {/* Details table */}
          <div className="mt-7">
            <h2 className="mb-3 text-lg font-semibold">Product details</h2>
            <dl className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line bg-white text-sm">
              {details.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[130px_1fr] px-4 py-3">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="mb-6 text-2xl font-bold">More products like this</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
