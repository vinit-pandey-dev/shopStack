// Thin fetch wrapper around the Spring Boot API.
// Same endpoints and JWT handling as the original vanilla-JS frontend.

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

const TOKEN_KEY = 'shopstack_token';
const USER_KEY = 'shopstack_user';

export const session = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  set: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = session.getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running on ' + API_BASE + '?');
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      session.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    const message =
      (data && (data.message || Object.values(data)[0])) || `Request failed (${res.status})`;
    const err = new Error(typeof message === 'string' ? message : 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const Api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`, { auth: false });
  },
  getProduct: (id) => request(`/products/${id}`, { auth: false }),
  getRelated: (id) => request(`/products/${id}/related`, { auth: false }),
  getCategories: () => request('/categories', { auth: false }),

  getCart: () => request('/cart'),
  addToCart: (productId, quantity) =>
    request('/cart', { method: 'POST', body: { productId, quantity } }),
  updateCartItem: (itemId, quantity) =>
    request(`/cart/${itemId}`, { method: 'PUT', body: { quantity } }),
  removeCartItem: (itemId) => request(`/cart/${itemId}`, { method: 'DELETE' }),

  // payload: { shippingAddress, paymentMethod: 'CARD'|'UPI'|'COD', cardNumber?, upiId? }
  placeOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  getOrders: () => request('/orders'),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'PUT' }),

  // AI assistant (RAG). history = earlier turns: [{ role: 'user'|'assistant', content }]
  chat: (message, history = []) => request('/ai/chat', { method: 'POST', body: { message, history } }),

  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // ---- Admin-only (backend requires ROLE_ADMIN) ----
  createProduct: (payload) => request('/products', { method: 'POST', body: payload }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: payload }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  createCategory: (payload) => request('/categories', { method: 'POST', body: payload }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  getAllOrders: () => request('/admin/orders'),
  updateOrderStatus: (id, status) => request(`/admin/orders/${id}/status`, { method: 'PUT', body: { status } }),
};

export const money = (n) => `$${Number(n || 0).toFixed(2)}`;

export function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}
