// Load All Orders
async function loadOrders() {
  const list = document.getElementById('orderList');
  list.innerHTML = "Loading...";

  const { data, error } = await sb
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    list.innerHTML = "Failed to load orders";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "No orders";
    return;
  }

  list.innerHTML = data.map(o => `
    <div class="card">
      <b>${o.customer_name || 'No Name'}</b><br>
      ${o.phone || ''}<br>
      <small>${new Date(o.created_at).toLocaleString()}</small><br>
      <b>${Number(o.total_amount || 0).toLocaleString()} Ks</b>
    </div>
  `).join('');
}
