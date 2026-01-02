// Load Customers + Order History
async function loadCustomers() {
  const list = document.getElementById('customerList');
  list.innerHTML = "Loading...";

  const { data, error } = await sb
    .from('customers')
    .select(`
      id,
      name,
      phone,
      orders (
        id,
        total_amount,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    list.innerHTML = "Failed to load customers";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "No customers";
    return;
  }

  list.innerHTML = data.map(c => {
    const totalSpend = (c.orders || []).reduce(
      (s, o) => s + Number(o.total_amount || 0), 0
    );

    return `
      <div class="card">
        <b>${c.name || 'No Name'}</b><br>
        ${c.phone || ''}<br>
        <hr>
        Orders: ${(c.orders || []).length}<br>
        Total Spend: ${totalSpend.toLocaleString()} Ks
      </div>
    `;
  }).join('');
}
