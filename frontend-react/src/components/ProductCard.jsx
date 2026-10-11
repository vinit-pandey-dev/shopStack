import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ImageOff, Loader2 } from 'lucide-react';
import { money } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product: p }) {
  const { isLoggedIn } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const out = p.stock === 0;
  const low = p.stock > 0 && p.stock <= 5;

  const handleAdd = async () => {
    if (!isLoggedIn) {
      toast('Log in to add items to your cart', 'error');
      navigate('/login', { state: { from: '/' } });
      return;
    }
    setAdding(true);
    try {
      await addItem(p.id, 1);
      toast(`${p.name} added to cart`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={`/products/${p.id}`} className="relative block aspect-[4/3] overflow-hidden bg-paper-dim">
        {p.imageUrl && !imgFailed ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-soft/40">
            <ImageOff size={36} />
          </div>
        )}
        {p.categoryName && (
          <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-pine backdrop-blur">
            {p.categoryName}
          </span>
        )}
        {out && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50 text-sm font-semibold uppercase tracking-wider text-white">
            Out of stock
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <Link to={`/products/${p.id}`} className="transition hover:text-pine">
          <h3 className="text-lg font-semibold leading-snug text-ink hover:text-pine">{p.name}</h3>
        </Link>
        <p className="line-clamp-2 flex-1 text-sm text-ink-soft">{p.description}</p>

        <div className="mt-2 flex items-end justify-between">
          <span className="font-mono text-xl font-semibold text-pine">{money(p.price)}</span>
          {!out && (
            <span className={`text-xs ${low ? 'font-semibold text-danger' : 'text-ink-soft'}`}>
              {low ? `Only ${p.stock} left` : `${p.stock} in stock`}
            </span>
          )}
        </div>

        <button onClick={handleAdd} disabled={out || adding} className="btn-brass mt-3 w-full">
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {adding ? 'Adding…' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
