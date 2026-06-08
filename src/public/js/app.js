/* Mercado Pago Payment Links - App */

const $ = (id) => document.getElementById(id);

let isLogin = true;

function showAuthError(msg) {
  const el = $('authError');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function formatCurrency(n) {
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

function formatDate(d) {
  return new Date(d).toLocaleString('es-AR');
}

/* ---- Auth ---- */

function checkAuth() {
  const token = API.getToken();
  if (token) {
    showDashboard();
  } else {
    showAuth();
  }
}

function showAuth() {
  $('authView').classList.remove('hidden');
  $('dashboardView').classList.add('hidden');
  $('nav').classList.add('hidden');
}

function showDashboard() {
  $('authView').classList.add('hidden');
  $('dashboardView').classList.remove('hidden');
  $('nav').classList.remove('hidden');
  const user = JSON.parse(localStorage.getItem('pmp_user') || '{}');
  $('userName').textContent = user.name || '';
  loadPayments();
}

/* ---- Auth Form ---- */

$('toggleAuth').addEventListener('click', (e) => {
  e.preventDefault();
  isLogin = !isLogin;
  $('nameField').classList.toggle('hidden', isLogin);
  $('authBtn').textContent = isLogin ? 'Iniciar sesion' : 'Registrarse';
  $('toggleMsg').textContent = isLogin ? 'No tenes cuenta?' : 'Ya tenes cuenta?';
  $('toggleAuth').textContent = isLogin ? 'Registrarse' : 'Iniciar sesion';
  $('authError').classList.add('hidden');
});

$('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('authError').classList.add('hidden');

  const email = $('email').value;
  const password = $('password').value;

  try {
    let result;
    if (isLogin) {
      result = await API.login(email, password);
    } else {
      const name = $('name').value;
      if (!name) return showAuthError('El nombre es obligatorio');
      result = await API.register(name, email, password);
    }

    API.setToken(result.token);
    localStorage.setItem('pmp_user', JSON.stringify(result.user));
    showDashboard();
  } catch (err) {
    showAuthError(err.message);
  }
});

/* ---- Logout ---- */

$('logoutBtn').addEventListener('click', () => {
  API.clearToken();
  localStorage.removeItem('pmp_user');
  showAuth();
});

/* ---- Create Payment ---- */

$('createBtn').addEventListener('click', () => {
  $('createModal').classList.remove('hidden');
  $('createError').classList.add('hidden');
  $('createForm').reset();
});

document.querySelectorAll('.close').forEach((el) => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  });
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.add('hidden');
  }
});

$('createForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('createError').classList.add('hidden');

  const amount = $('amount').value;
  const description = $('descripcion').value;

  try {
    const result = await API.createPayment(amount, description);
    $('createModal').classList.add('hidden');
    $('generatedLink').value = result.init_point;
    $('linkModal').classList.remove('hidden');
    $('copyMsg').classList.add('hidden');
    loadPayments();
  } catch (err) {
    $('createError').textContent = err.message;
    $('createError').classList.remove('hidden');
  }
});

/* ---- Copy Link ---- */

$('copyBtn').addEventListener('click', () => {
  const input = $('generatedLink');
  input.select();
  navigator.clipboard.writeText(input.value).catch(() => {});
  $('copyMsg').classList.remove('hidden');
  setTimeout(() => $('copyMsg').classList.add('hidden'), 2000);
});

/* ---- Load Payments ---- */

async function loadPayments() {
  try {
    const payments = await API.getPayments();
    renderPayments(payments);
  } catch (err) {
    $('paymentsList').innerHTML = `<p class="empty">Error al cargar: ${err.message}</p>`;
  }
}

function statusClass(status) {
  const map = { pending: 'status-pending', approved: 'status-approved', rejected: 'status-rejected', cancelled: 'status-cancelled' };
  return 'status ' + (map[status] || 'status-pending');
}

function statusLabel(s) {
  const map = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado', cancelled: 'Cancelado' };
  return map[s] || s;
}

function renderPayments(payments) {
  if (payments.length === 0) {
    $('paymentsList').innerHTML = '<p class="empty">Todavia no creaste ningun link de pago</p>';
    return;
  }

  let html = `<div class="table-wrap"><table>
    <thead><tr>
      <th>ID</th>
      <th>Descripcion</th>
      <th>Monto</th>
      <th>Estado</th>
      <th>Pagador</th>
      <th>Fecha</th>
      <th></th>
    </tr></thead><tbody>`;

  for (const p of payments) {
    html += `<tr>
      <td>#${p.id}</td>
      <td>${p.description}</td>
      <td class="amount-cell">${formatCurrency(p.transaction_amount)}</td>
      <td><span class="${statusClass(p.status)}">${statusLabel(p.status)}</span></td>
      <td>${p.payer_email || '-'}</td>
      <td>${formatDate(p.created_at)}</td>
      <td>${p.init_point ? `<a href="${p.init_point}" target="_blank" class="link-btn">Abrir link</a>` : '-'}</td>
    </tr>`;
  }

  html += '</tbody></table></div>';
  $('paymentsList').innerHTML = html;
}

/* ---- Init ---- */

checkAuth();
