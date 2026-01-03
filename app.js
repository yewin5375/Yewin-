// ၁။ Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCW_jACdwWmN2nwlEOxR6tdTBqLXHy",
    authDomain: "myin-thar-chicken-bbq.firebaseapp.com",
    projectId: "myin-thar-chicken",
    storageBucket: "myin-thar-chicken-bbq.appspot.com",
    messagingSenderId: "45639130854",
    appId: "1:45639130854:web:779ecef328580d10e95"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ၂။ Notification စနစ်
async function initNotification() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.register('firebase-messaging-sw.js');
            const token = await messaging.getToken({
                serviceWorkerRegistration: registration,
                vapidKey: "BKEpbLekJWc0eS5TDIKyB-Wp79lnfff9wF3ivDJj0LQG_s5Z7R2kKasvRAOaMvTxkRS6rkPfdIqLaIqR50O"
            });

            if (token) {
                await window.sb.from('user_tokens').upsert([{ token: token }], { onConflict: 'token' });
                console.log("Token Saved Successfully");
            }
        }
    } catch (error) {
        console.error("Notification Error:", error);
    }
}

// ၃။ Dashboard Stats
async function loadDashboardStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: orders, error } = await window.sb
            .from('orders')
            .select('total_amount')
            .gte('created_at', today);

        if (!error) {
            const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
            document.getElementById('todayOrders').innerText = orders.length + " Orders";
            document.getElementById('todayRevenue').innerText = totalRevenue.toLocaleString() + " Ks";
        }
    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

// ၄။ Navigation (View Switcher)
function showView(id) {
    // View များအားလုံးကို ဖျောက်ရန်
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });

    // ရွေးထားသော View ကိုပြရန်
    const targetView = document.getElementById(id);
    if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
    }

    // Data Load လုပ်ရန်
    if (id === 'dashboard') loadDashboardStats();
    if (id === 'menu-manager') typeof loadMenuItems === 'function' && loadMenuItems();
    if (id === 'customers') typeof loadCustomers === 'function' && loadCustomers();
    if (id === 'orders') typeof loadOrders === 'function' && loadOrders();
}

// ၅။ Window Load
window.onload = () => {
    showView('dashboard');
    initNotification();
    setInterval(loadDashboardStats, 30000);
};

