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

// ၂။ Notification စနစ် (Phase 4)
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
                // Supabase ထဲမှာ Token သိမ်းမည်
                await window.sb.from('user_tokens').upsert([{ token: token }], { onConflict: 'token' });
                console.log("Token Saved Successfully");
            }
        }
    } catch (error) {
        console.error("Notification Error:", error);
    }
}

// ၃။ Dashboard Stats (Blueprint Dashboard & Reports အပိုင်း)
async function loadDashboardStats() {
    try {
        // Timezone လွဲမှားမှုမရှိအောင် ယနေ့ရက်စွဲကို ယူသည်
        const now = new Date();
        const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        const { data, error } = await window.sb
            .from('orders')
            .select('total_amount')
            .gte('created_at', today);

        if (error) throw error;

        if (data) {
            const totalRevenue = data.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
            
            // HTML UI သို့ Data များ ထည့်ခြင်း
            const orderEl = document.getElementById('todayOrders');
            const revenueEl = document.getElementById('todayRevenue');
            
            if (orderEl) orderEl.innerText = `${data.length} Orders`;
            if (revenueEl) revenueEl.innerText = `${totalRevenue.toLocaleString()} Ks`;
        }
    } catch (e) {
        console.error("Dashboard Stats Error:", e.message);
    }
}

// ၄။ Navigation Logic (Phase 2 UI Overview)
function changeNav(id, el) {
    // လက်ရှိ Page ကို Browser မှာ မှတ်ထားမည် (Refresh လုပ်ရင် ပြန်သုံးဖို့)
    localStorage.setItem('activeView', id);

    // Nav Item အရောင်ပြောင်းခြင်း
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    if (el) {
        el.classList.add('active');
    } else {
        // ID အလိုက် Nav Item ကို ရှာပြီး Active ပေးခြင်း
        const navMap = { 'dashboard': 0, 'orders': 1, 'menu-manager': 2, 'customers': 3 };
        const items = document.querySelectorAll('.nav-item');
        if (items[navMap[id]]) items[navMap[id]].classList.add('active');
    }

    // Back Button ဖျောက်/ပြ Logic
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) backBtn.style.visibility = (id === 'dashboard') ? 'hidden' : 'visible';

    // Header Title ပြောင်းခြင်း
    const titles = { 
        'dashboard': 'Admin Overview', 
        'orders': 'Live Orders', 
        'menu-manager': 'Menu Gallery', 
        'customers': 'VIP Customers' 
    };
    const titleEl = document.getElementById('viewTitle');
    if (titleEl) titleEl.innerText = titles[id];

    showView(id);
}

// View တစ်ခုချင်းစီကို ပြသခြင်း
function showView(id) {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });

    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    // သက်ဆိုင်ရာ View အလိုက် Data Load လုပ်ပေးခြင်း
    if (id === 'dashboard') loadDashboardStats();
    if (id === 'orders') typeof loadOrders === 'function' && loadOrders();
    if (id === 'menu-manager') typeof loadMenuItems === 'function' && loadMenuItems();
    if (id === 'customers') typeof loadCustomers === 'function' && loadCustomers();
}

// Back Arrow နှိပ်လျှင် Dashboard သို့ ပြန်သွားခြင်း
function goBack() {
    changeNav('dashboard', null);
}

// ၅။ Window Load (App စတင်ခြင်း)
window.onload = () => {
    // သိမ်းထားသော Page သို့ ပြန်သွားမည်
    const savedView = localStorage.getItem('activeView') || 'dashboard';
    changeNav(savedView, null);
    
    // Notification စတင်ခြင်း
    initNotification();
    
    // ၃၀ စက္ကန့်တစ်ခါ Dashboard ကို Auto Update လုပ်ပေးမည်
    setInterval(loadDashboardStats, 30000);
};

// ၆။ Scroll Back to Top UI
const backToTopBtn = document.createElement('div');
backToTopBtn.id = "backToTop";
backToTopBtn.innerHTML = "↑";
backToTopBtn.style.cssText = `
    position: fixed; bottom: 85px; right: 20px; 
    width: 45px; height: 45px; background: var(--primary); 
    color: white; border-radius: 50%; display: none; 
    align-items: center; justify-content: center; 
    cursor: pointer; z-index: 999; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;
document.body.appendChild(backToTopBtn);

window.onscroll = function() {
    if (document.body.scrollTop > 150 || document.documentElement.scrollTop > 150) {
        backToTopBtn.style.display = "flex";
    } else {
        backToTopBtn.style.display = "none";
    }
};

backToTopBtn.onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

