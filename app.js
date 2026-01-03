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
// ၁။ Dashboard Stats တွက်ချက်ခြင်း
async function loadDashboardStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await window.sb
            .from('orders')
            .select('total_amount')
            .gte('created_at', today);

        if (!error) {
            const totalRevenue = data.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
            document.getElementById('todayOrders').innerText = data.length + " Orders";
            document.getElementById('todayRevenue').innerText = totalRevenue.toLocaleString() + " Ks";
        }
    } catch (e) { console.error(e); }
}

// ၂။ Page ပြောင်းလဲခြင်း (Sidebar Logic)
function showView(id) {
    // View အားလုံးကို အရင်ဖျောက်မယ်
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });

    // ရွေးလိုက်တဲ့ View ကို ပြမယ်
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    // သက်ဆိုင်ရာ Data Load လုပ်မယ်
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

// Back to Top Button Logic
const backBtn = document.createElement('div');
backBtn.id = "backToTop";
backBtn.innerHTML = "↑";
document.body.appendChild(backBtn);

window.onscroll = function() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backBtn.style.display = "flex";
    } else {
        backBtn.style.display = "none";
    }
};

backBtn.onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
