

// စာမျက်နှာ ပြောင်းလဲခြင်း Logic
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  if (id === 'orders') loadOrders();
  if (id === 'customers') loadCustomers();
  if (id === 'dashboard') loadDashboard();
}

// Dashboard အတွက် Data တွက်ချက်ခြင်း
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

  document.getElementById('todayOrders').innerText = data.length + " Orders";
  const total = data.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  document.getElementById('todayRevenue').innerText = total.toLocaleString() + " Ks";
}

// App စဖွင့်ရင် Dashboard ကို အရင်ပြမယ်
window.onload = loadDashboard;

