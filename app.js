// app.js

// --- ၁။ Dashboard Logic ---
async function loadDashboard() {
    if (typeof sb === 'undefined') return;
    try {
        const { data, error } = await sb.from('orders').select('*');
        if (error) throw error;
        document.getElementById('todayOrders').innerText = data.length + " Orders";
        const total = data.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        document.getElementById('todayRevenue').innerText = total.toLocaleString() + " Ks";
    } catch (err) { console.error(err); }
}

// --- ၂။ Firebase Notification Logic ---
const firebaseConfig = {
  apiKey: "AIzaSyCW_jACdwWmN2nwlEOxR6tdTBqLXHyvE0w",
  authDomain: "myin-thar-chicken-bbq.firebaseapp.com",
  projectId: "myin-thar-chicken-bbq",
  storageBucket: "myin-thar-chicken-bbq.firebasestorage.app",
  messagingSenderId: "45639130854",
  appId: "1:45639130854:web:779ecef328580d10e9e527"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

async function initNotification() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await messaging.getToken({
                vapidKey: "BKEpbLekJWc0eS5TDIKyB-Wp79lnfff9wF3ivDJj0LQG_s5Z7R2kKasvRAOaMvTxkRS6rkPfdIqLaIqR50O46xY"
            });
            if (token) {
                // Supabase ထဲ သိမ်းမယ်
                await sb.from('user_tokens').upsert([{ token: token }], { onConflict: 'token' });
                console.log("Token saved!");
            }
        }
    } catch (error) { console.log(error); }
}

// --- ၃။ App Start ---
window.onload = function() {
    loadDashboard();
    initNotification();
};

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'orders') loadOrders();
    if (id === 'dashboard') loadDashboard();
}

// app.js ထဲမှာ ဒါကို ထည့်ပါ
async function loadCustomers() {
  const list = document.getElementById('customer-list'); // ID ကို သေချာစစ်ပါ (index.html မှာ customer-list ဖြစ်ရမယ်)
  if (!list) return;

  list.innerHTML = "Loading...";

  const { data, error } = await window.sb
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
    `);

  if (error) {
    list.innerHTML = "Failed to load customers";
    return;
  }

  list.innerHTML = data.map(c => {
    const totalSpend = (c.orders || []).reduce((s, o) => s + Number(o.total_amount || 0), 0);
    return `
      <div class="stat-card" style="margin-bottom: 10px; text-align: left;">
        <b>👤 ${c.name || 'No Name'}</b><br>
        📞 ${c.phone || '-'}<br>
        📦 Orders: ${(c.orders || []).length}<br>
        💰 Total: ${totalSpend.toLocaleString()} Ks
      </div>
    `;
  }).join('');
}
// app.js ရဲ့ window.onload မှာ ဒါလေး ဖြည့်လိုက်ပါ
window.onload = function() {
    loadDashboard();
    initNotification(); // Firebase အတွက်
    listenToOrders();   // Supabase Realtime အတွက် (အသစ်)
};
