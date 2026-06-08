const API = {
  token: null,

  getToken() {
    return localStorage.getItem('pmp_token');
  },

  setToken(token) {
    this.token = token;
    localStorage.setItem('pmp_token', token);
  },

  clearToken() {
    this.token = null;
    localStorage.removeItem('pmp_token');
  },

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (method !== 'GET' && res.status === 204) return null;

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  },

  register(name, email, password) {
    return this.request('POST', '/api/auth/register', { name, email, password });
  },

  login(email, password) {
    return this.request('POST', '/api/auth/login', { email, password });
  },

  getPayments() {
    return this.request('GET', '/api/payments');
  },

  createPayment(transaction_amount, description) {
    return this.request('POST', '/api/payments', { transaction_amount, description });
  },
};
