import { useEffect, useState } from 'react';
import { Search, Truck, ShieldCheck, RefreshCcw, PackageOpen } from 'lucide-react';
import { Api } from '../api/client';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';

const perks = [
  { icon: Truck, title: 'Free shipping', text: 'On every order, no minimum.' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'JWT-protected account & orders.' },
  { icon: RefreshCcw, title: 'Live stock', text: 'Inventory updates as you buy.' },
];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Api.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = {};
    if (debounced) params.search = debounced;
    else if (activeCategory) params.categoryId = activeCategory;

    Api.getProducts(params)
      .then((data) => !cancelled && setProducts(data))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced, activeCategory]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-pine text-paper">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brass/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-pine-light blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-brass-light">
            The ShopStack catalog
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] text-white md:text-6xl">
            Everyday goods, <span className="text-brass-light">thoughtfully</span> sourced.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-paper/75">
            Electronics, books and clothing — a small, curated catalog backed by a Spring Boot API.
          </p>

          <div className="relative mt-9 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" size={18} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-lg border-0 bg-white py-3.5 pl-11 pr-4 text-ink shadow-card placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:grid-cols-3">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-dim text-pine">
                <Icon size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-ink-soft">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Catalog */}
      <section className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              activeCategory === null
                ? 'border-pine bg-pine text-white'
                : 'border-line bg-white text-ink-soft hover:border-pine hover:text-pine'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSearch('');
                setActiveCategory(c.id);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                activeCategory === c.id
                  ? 'border-pine bg-pine text-white'
                  : 'border-line bg-white text-ink-soft hover:border-pine hover:text-pine'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-danger/30 bg-red-50 p-8 text-center">
            <h3 className="text-lg font-semibold text-danger">Couldn't load products</h3>
            <p className="mt-1 text-sm text-ink-soft">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-ink-soft">
            <PackageOpen size={40} className="mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-semibold text-ink">No products found</h3>
            <p className="text-sm">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
