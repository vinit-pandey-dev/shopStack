# ShopStack — React + Tailwind frontend

Drop-in replacement for the plain HTML/CSS/JS frontend. Talks to the **same Spring Boot API** (same endpoints, same JWT handling) — no backend changes needed.

**Stack:** React 18 · Vite · React Router 6 · Tailwind CSS 3 · lucide-react

## Run it

1. Start the Spring Boot backend first (http://localhost:8080).
2. In this folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:5173

Requires Node 18+. If your API runs elsewhere, edit `VITE_API_BASE` in `.env`.

## Structure

```
src/
├── api/client.js          fetch wrapper + JWT header + all API calls (same endpoints as before)
├── context/
│   ├── AuthContext.jsx    login / register / logout, user + role in state, persisted in localStorage
│   ├── CartContext.jsx    cart items, count, total, add / update / remove (powers the navbar badge)
│   └── ToastContext.jsx   success / error toasts
├── components/            Navbar, Footer, ProductCard, ProductSkeleton, ProtectedRoute
└── pages/                 Home (search + categories), Login, Register, Cart (checkout), Orders,
                           Admin (admin-only: products + categories CRUD)
```

## Admin dashboard

Log in as `admin` / `admin123` — an **Admin** link appears in the navbar and opens `/admin`, where you can add / edit / delete products and add / delete categories. Regular users are redirected away (`AdminRoute`), and the backend independently rejects non-admin calls with 403.
Note: deleting a product that's already in a cart or a past order fails (database foreign key) — the UI shows an error toast.

## Deploying

`npm run build` outputs a static `dist/` folder — upload to Netlify / Vercel / Cloudflare Pages.
Set `VITE_API_BASE` to your deployed backend URL at build time, and add the frontend's URL to the backend's `CORS_ALLOWED_ORIGINS`.
For Netlify/Vercel, add an SPA fallback (all routes → `index.html`) so refreshing on `/cart` doesn't 404.
