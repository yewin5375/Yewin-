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

// ၄။ Navigation Logic (Refresh ပတ်သက်သော logic အပါအဝင်)
function changeNav(id, el) {
    // လက်ရှိ Page ကို Browser မှာ မှတ်ထားမယ် (Refresh လုပ်ရင် ပြန်သုံးဖို့)
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
    if (document.getElementById('viewTitle')) document.getElementById('viewTitle').innerText = titles[id];

    showView(id);
}

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

    // သက်ဆိုင်ရာ Data Load လုပ်ခြင်း
    if (id === 'dashboard') loadDashboardStats();
    if (id === 'menu-manager') typeof loadMenuItems === 'function' && loadMenuItems();
    if (id === 'customers') typeof loadCustomers === 'function' && loadCustomers();
    if (id === 'orders') typeof loadOrders === 'function' && loadOrders();
}

// Back Arrow နှိပ်လျှင် Dashboard ပြန်သွားခြင်း
function goBack() {
    changeNav('dashboard', null);
}

// ၅။ Window Load (Refresh လုပ်လျှင် Page မပျောက်စေရန်)
window.onload = () => {
    // သိမ်းထားတဲ့ Page ရှိရင် အဲ့ဒီကိုသွားမယ်၊ မရှိရင် Dashboard သွားမယ်
    const savedView = localStorage.getItem('activeView') || 'dashboard';
    changeNav(savedView, null);
    
    initNotification();
    setInterval(loadDashboardStats, 30000); // ၃၀ စက္ကန့်တစ်ခါ Dashboard update လုပ်မယ်
};

// ၆။ Back to Top Button
const backToTopBtn = document.createElement('div');
backToTopBtn.id = "backToTop";
backToTopBtn.innerHTML = "↑";
document.body.appendChild(backToTopBtn);

window.onscroll = function() {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        backToTopBtn.style.display = "flex";
    } else {
        backToTopBtn.style.display = "none";
    }
};

backToTopBtn.onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

async function loadDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // ယနေ့ အော်ဒါများယူခြင်း
    const { data, error } = await window.sb
        .from('orders')
        .select('total_amount')
        .gte('created_at', today);

    if (!error) {
        const totalRevenue = data.reduce((sum, row) => sum + row.total_amount, 0);
        document.getElementById('todayRevenue').innerText = totalRevenue.toLocaleString() + " Ks";
        document.getElementById('todayOrders').innerText = data.length + " Orders";
    }
}

