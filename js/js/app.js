// View Switch
function showView(id) {
  document.querySelectorAll('.view').forEach(v =>
    v.classList.remove('active')
  );
  document.getElementById(id).classList.add('active');

  if (id === 'orders' && typeof loadOrders === 'function') {
    loadOrders();
  }

  if (id === 'customers' && typeof loadCustomers === 'function') {
    loadCustomers();
  }
}

// Dashboard - Today Summary
async function loadDashboard() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await sb
    .from('orders')
    .select('*')
    .gte('created_at', today);

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById('todayOrders').innerText =
    data.length + " Orders";

  const total = data.reduce(
    (sum, o) => sum + Number(o.total_amount || 0), 0
  );

  document.getElementById('todayRevenue').innerText =
    total.toLocaleString() + " Ks";
}

// Initial load
loadDashboard();
