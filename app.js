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

// app.js ထဲက initNotification function ကို ဒါလေးနဲ့ အစားထိုးလိုက်ပါ


// app.js ထဲက initNotification အပိုင်းမှာ ဒါလေး ပါရပါမယ်
async function initNotification() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        // Service worker ကို register လုပ်တာ သေချာပါစေ
        const registration = await navigator.serviceWorker.register('firebase-messaging-sw.js');
        
        const token = await messaging.getToken({
            serviceWorkerRegistration: registration, // ဒါကို ထည့်ပေးရပါမယ်
            vapidKey: "BKEpbLekJWc0eS5TDIKyB-Wp79lnfff9wF3ivDJj0LQG_s5Z7R2kKasvRAOaMvTxkRS6rkPfdIqLaIqR50O46xY"
        });
        
        if (token) {
            await window.sb.from('user_tokens').upsert([{ token: token }], { onConflict: 'token' });
            console.log("Token Saved Successfully!");
        }
    }
}


async function loadDashboard() {
    const { data, error } = await window.sb.from('orders').select('*');
    if (!error) {
        document.getElementById('todayOrders').innerText = data.length + " Orders";
        const total = data.reduce((s, o) => s + Number(o.total_amount || 0), 0);
        document.getElementById('todayRevenue').innerText = total.toLocaleString() + " Ks";
    }
}

async function loadCustomers() {
    const { data, error } = await window.sb.from('customers').select('*').order('total_spent', { ascending: false });
    const listDiv = document.getElementById('customer-list');
    if (!error) {
        listDiv.innerHTML = data.map(c => `
            <div class="stat-card" style="text-align:left;">
                <b>👤 ${c.name || 'Unknown'} (${c.phone})</b>
                <p>Total Spent: ${Number(c.total_spent).toLocaleString()} Ks</p>
                <p>Points: ${c.points} pts | Orders: ${c.total_orders}</p>
            </div>
        `).join('');
    }
}


