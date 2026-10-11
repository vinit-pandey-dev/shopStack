import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, ShieldCheck, ImageOff } from 'lucide-react';
import { Api, money } from '../api/client';
import { useToast } from '../context/ToastContext';

const emptyForm = { name: '', description: '', price: '', stock: '', imageUrl: '', categoryId: '' };

function ProductModal({ product, categories, onClose, onSaved }) {
  const toast = useToast();
  const editing = !!product;
  const [form, setForm] = useState(
    editing
      ? {
          name: product.name,
          description: product.description || '',
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl || '',
          categoryId: product.categoryId ?? '',
        }
      : emptyForm
  );
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: parseInt(form.stock, 10),
      imageUrl: form.imageUrl.trim() || null,
      categoryId: form.categoryId === '' ? null : Number(form.categoryId),
    };
    try {
      if (editing) await Api.updateProduct(product.id, payload);
      else await Api.createProduct(payload);
      toast(editing ? 'Product updated' : 'Product created');
      onSaved();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <form
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editing ? 'Edit product' : 'Add product'}</h2>
          <button type="button" onClick={onClose} className="btn-ghost !px-2" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input resize-none" value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price ($)</label>
              <input type="number" step="0.01" min="0" className="input" required value={form.price} onChange={set('price')} />
            </div>
            <div>
              <label className="label">Stock</label>
              <input type="number" min="0" step="1" className="input" required value={form.stock} onChange={set('stock')} />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.categoryId} onChange={set('categoryId')}>
              <option value="">— None —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Image URL</label>
            <input type="url" className="input" placeholder="https://…" value={form.imageUrl} onChange={set('imageUrl')} />
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-brass">
            {busy && <Loader2 size={16} className="animate-spin" />} {editing ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProductsTab({ products, categories, reload }) {
  const toast = useToast();
  const [modal, setModal] = useState(null); // null | 'new' | product

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    try {
      await Api.deleteProduct(p.id);
      toast('Product deleted');
      reload();
    } catch (e) {
      toast(`Couldn't delete — it may be in a cart or past order. (${e.message})`, 'error');
    }
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-ink-soft">{products.length} products</p>
        <button onClick={() => setModal('new')} className="btn-brass"><Plus size={16} /> Add product</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-paper/70 text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-5 py-3 font-semibold">Product</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 text-right font-semibold">Price</th>
              <th className="px-5 py-3 text-right font-semibold">Stock</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-paper/40">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-paper-dim">
                      {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> :
                        <div className="flex h-full items-center justify-center text-ink-soft/40"><ImageOff size={16} /></div>}
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-soft">{p.categoryName || '—'}</td>
                <td className="px-5 py-3 text-right font-mono">{money(p.price)}</td>
                <td className={`px-5 py-3 text-right font-mono ${p.stock <= 5 ? 'font-semibold text-danger' : ''}`}>{p.stock}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setModal(p)} className="btn-ghost !px-2.5 !py-1.5" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => remove(p)} className="btn-ghost !px-2.5 !py-1.5 text-danger hover:!bg-red-50" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload(); }}
        />
      )}
    </>
  );
}

function CategoriesTab({ categories, reload }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await Api.createCategory({ name: name.trim(), description: description.trim() });
      toast('Category created');
      setName(''); setDescription('');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await Api.deleteCategory(c.id);
      toast('Category deleted');
      reload();
    } catch (e) {
      toast(`Couldn't delete — products may still use it. (${e.message})`, 'error');
    }
  };

  return (
    <div className="grid items-start gap-6 md:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-ink-soft">{c.description || 'No description'}</p>
            </div>
            <button onClick={() => remove(c)} className="btn-ghost !px-2.5 !py-1.5 text-danger hover:!bg-red-50" aria-label="Delete"><Trash2 size={15} /></button>
          </li>
        ))}
        {categories.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-soft">No categories yet.</li>}
      </ul>

      <form onSubmit={add} className="space-y-4 rounded-xl border border-line bg-white p-5 shadow-card">
        <h3 className="text-lg font-semibold">New category</h3>
        <div>
          <label className="label">Name</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button disabled={busy} className="btn-brass w-full">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add category
        </button>
      </form>
    </div>
  );
}

const statusBadge = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-sky-100 text-sky-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function OrdersTab() {
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => Api.getAllOrders().then(setOrders).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const change = async (o, status) => {
    if (!status) return;
    if (status === 'CANCELLED') {
      const extra = o.paymentStatus === 'SUCCESS' ? ' and the payment refunded' : '';
      if (!window.confirm(`Cancel order #${o.id}? Stock will be restored${extra}.`)) return;
    }
    setBusyId(o.id);
    try {
      await Api.updateOrderStatus(o.id, status);
      toast(`Order #${o.id} marked ${status.toLowerCase()} — customer notified`);
      await load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <p className="rounded-xl border border-danger/30 bg-red-50 p-6 text-center text-danger">{error}</p>;
  if (orders === null) return <div className="py-24 text-center text-ink-soft"><Loader2 className="mx-auto animate-spin" /></div>;
  if (orders.length === 0) return <p className="py-20 text-center text-ink-soft">No orders yet.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-card">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-line bg-paper/70 text-xs uppercase tracking-wider text-ink-soft">
          <tr>
            <th className="px-5 py-3 font-semibold">Order</th>
            <th className="px-5 py-3 font-semibold">Customer</th>
            <th className="px-5 py-3 text-right font-semibold">Total</th>
            <th className="px-5 py-3 font-semibold">Payment</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Update</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {orders.map((o) => {
            const final = o.status === 'DELIVERED' || o.status === 'CANCELLED';
            return (
              <tr key={o.id} className="hover:bg-paper/40">
                <td className="px-5 py-3">
                  <p className="font-mono font-medium">#{o.id}</p>
                  <p className="text-xs text-ink-soft">{new Date(o.orderDate).toLocaleDateString()} · {o.items.length} item(s)</p>
                </td>
                <td className="px-5 py-3">{o.customer}</td>
                <td className="px-5 py-3 text-right font-mono">{money(o.totalAmount)}</td>
                <td className="px-5 py-3 text-xs">
                  <p className="font-medium">{o.paymentMethod || '—'}</p>
                  <p className="text-ink-soft">{o.paymentStatus || ''}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusBadge[o.status] || ''}`}>{o.status}</span>
                </td>
                <td className="px-5 py-3">
                  <select className="input !w-auto !py-1.5 text-xs" value="" disabled={final || busyId === o.id}
                    onChange={(e) => change(o, e.target.value)}>
                    <option value="">{final ? 'Closed' : 'Change status…'}</option>
                    {o.status !== 'SHIPPED' && <option value="SHIPPED">Mark shipped</option>}
                    <option value="DELIVERED">Mark delivered</option>
                    <option value="CANCELLED">Cancel order</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([Api.getProducts(), Api.getCategories()]);
      setProducts(p);
      setCategories(c);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabCls = (t) =>
    `border-b-2 px-1 pb-3 text-sm font-medium transition ${
      tab === t ? 'border-brass text-pine' : 'border-transparent text-ink-soft hover:text-pine'
    }`;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pine text-brass-light"><ShieldCheck size={22} /></span>
        <div>
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
          <p className="text-sm text-ink-soft">Manage the catalog and fulfil orders. Only visible to admin accounts.</p>
        </div>
      </div>

      <div className="mb-6 flex gap-8 border-b border-line">
        <button className={tabCls('products')} onClick={() => setTab('products')}>Products</button>
        <button className={tabCls('categories')} onClick={() => setTab('categories')}>Categories</button>
        <button className={tabCls('orders')} onClick={() => setTab('orders')}>Orders</button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-ink-soft"><Loader2 className="mx-auto animate-spin" /></div>
      ) : error ? (
        <p className="rounded-xl border border-danger/30 bg-red-50 p-6 text-center text-danger">{error}</p>
      ) : tab === 'products' ? (
        <ProductsTab products={products} categories={categories} reload={load} />
      ) : tab === 'categories' ? (
        <CategoriesTab categories={categories} reload={load} />
      ) : (
        <OrdersTab />
      )}
    </div>
  );
}
