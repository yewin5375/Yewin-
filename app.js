// ၁။ Firebase Configuration (အစ်ကို့ Key များအတိုင်း)
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

// ၂။ Notification စနစ် (အော်ဒါအသစ်ဝင်ရင် သိအောင်လုပ်ခြင်း)
async function initNotification() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // Service Worker Register လုပ်ခြင်း
            const registration = await navigator.serviceWorker.register('firebase-messaging-sw.js');
            
            // FCM Token ယူခြင်း
            const token = await messaging.getToken({
                serviceWorkerRegistration: registration,
                vapidKey: "BKEpbLekJWc0eS5TDIKyB-Wp79lnfff9wF3ivDJj0LQG_s5Z7R2kKasvRAOaMvTxkRS6rkPfdIqLaIqR50O"
            });

            if (token) {
                // Supabase ထဲမှာ Token သိမ်းမည် (window.supabase လို့ သုံးပေးပါ)
                await supabase.from('user_tokens').upsert([{ token: token }], { onConflict: 'token' });
                console.log("Push Token Saved");
            }
        }
    } catch (error) {
        console.warn("Notification error (Probably Blocked):", error);
    }
}

// ၃။ Dashboard Stats (ယနေ့ရောင်းအားပြသခြင်း)
async function loadDashboardStats() {
    try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('orders')
            .select('total_amount')
            .gte('created_at', today);

        if (error) throw error;

        if (data) {
            const totalRevenue = data.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
            
            const orderEl = document.getElementById('todayOrders');
            const revenueEl = document.getElementById('todayRevenue');
            
            if (orderEl) orderEl.innerText = `${data.length} Orders`;
            if (revenueEl) revenueEl.innerText = `${totalRevenue.toLocaleString()} Ks`;
        }
    } catch (e) {
        console.error("Dashboard Stats Error:", e.message);
    }
}

// ၄။ Navigation Logic (Page ပြောင်းခြင်း)
function changeNav(id, el) {
    localStorage.setItem('activeView', id);

    // Nav Item အရောင်ပြောင်းခြင်း
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Header Title ပြောင်းခြင်း
    const titles = { 
        'dashboard': 'Admin Overview', 
        'orders': 'Live Orders', 
        'menu-manager': 'Menu Gallery', 
        'customers': 'VIP Customers' 
    };
    
    const titleEl = document.getElementById('viewTitle');
    if (titleEl) titleEl.innerText = titles[id] || 'Admin';

    showView(id);
}

function showView(id) {
    // အကုန်ဖျောက်ပြီးမှ သက်ဆိုင်ရာ Page ကို ပြခြင်း
    document.querySelectorAll('.page-content').forEach(v => {
        v.classList.add('hidden');
    });

    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
    }

    // Data Load လုပ်ပေးခြင်း
    if (id === 'dashboard') loadDashboardStats();
    if (id === 'orders') typeof fetchOrders === 'function' && fetchOrders();
    if (id === 'menu-manager') typeof renderMenuWithControls === 'function' && renderMenuWithControls();
    if (id === 'customers') typeof fetchAllCustomers === 'function' && fetchAllCustomers();
}

// ၅။ Window Load (App စတင်ခြင်း)
window.onload = () => {
    const savedView = localStorage.getItem('activeView') || 'dashboard';
    changeNav(savedView, null);
    
    initNotification();
    setInterval(loadDashboardStats, 30000); // ၃၀ စက္ကန့်တစ်ခါ အော်ဒါအသစ်ရှိမရှိ စစ်မည်
};
