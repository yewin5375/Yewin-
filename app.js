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
                await window.sb.from('user_tokens').upsert([{ token: token }], { onConflict: 'token' });
                console.log("Token saved!");
            }
        }
    } catch (e) { console.log(e); }
}

async function loadDashboard() {
    const { data, error } = await window.sb.from('orders').select('*');
    if (!error) {
        document.getElementById('todayOrders').innerText = data.length + " Orders";
        const total = data.reduce((s, o) => s + Number(o.total_amount || 0), 0);
        document.getElementById('todayRevenue').innerText = total.toLocaleString() + " Ks";
    }
}

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'orders') loadOrders();
    if (id === 'dashboard') loadDashboard();
}

window.onload = () => {
    loadDashboard();
    initNotification();
};

