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
    // လက်ရှိ Page ID ကို သိမ်းမယ်
    localStorage.setItem('activeView', id);

    // Nav Item အရောင်ပြောင်းခြင်း
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Header Title ပြောင်းခြင်း (ID နာမည်တွေနဲ့ Titles တွေကို ညှိထားပါတယ်)
    const titles = { 
        'dashboard': 'Admin Overview', 
        'order-page': 'Live Orders', 
        'menu-page': 'Menu Gallery', 
        'customer-page': 'VIP Customers',
        'report-page': 'Sales Insights'
    };
    
    const titleEl = document.getElementById('viewTitle');
    if (titleEl) titleEl.innerText = titles[id] || 'Admin';

    // ခလုတ်ကို အရောင်တင်ခြင်း
    if (el) {
        el.classList.add('active');
    } else {
        const activeBtn = document.querySelector(`.nav-item[onclick*="${id}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    showView(id);
}

function showView(id) {
    // အကုန်ဖျောက်
    document.querySelectorAll('.page-content').forEach(v => {
        v.classList.add('hidden');
    });

    // သက်ဆိုင်ရာ Page ကို ပြ (HTML ID နဲ့ ကိုက်အောင် စစ်ပေးပါ)
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
    }

    // Data Load လုပ်ပေးခြင်း (Function နာမည်တွေ မှန်အောင် စစ်ပါ)
    if (id === 'dashboard') loadDashboardStats();
    if (id === 'order-page') typeof fetchOrders === 'function' && fetchOrders();
    if (id === 'menu-page') typeof fetchMenuItems === 'function' && fetchMenuItems();
    if (id === 'customer-page') typeof fetchAllCustomers === 'function' && fetchAllCustomers();
    if (id === 'report-page') typeof loadReports === 'function' && loadReports();
}

// ၅။ Window Load (App စတင်ခြင်း)
// ၅။ Window Load (App စတင်ခြင်း)
window.onload = () => {
    // LocalStorage ထဲက သိမ်းထားတဲ့ view ကို ယူမယ်၊ မရှိရင် 'dashboard' ကို သုံးမယ်
    const savedView = localStorage.getItem('activeView') || 'dashboard';
    
    // UI မှာ Nav item လေးတွေကိုပါ active ဖြစ်အောင် လုပ်ဖို့ selector သေချာရှာရပါမယ်
    const activeNavItem = document.querySelector(`.nav-item[onclick*="'${savedView}'"]`);
    
    // Page ပြောင်းလဲခြင်း function ကို ခေါ်မယ်
    changeNav(savedView, activeNavItem);
    
    // တခြား Init function များ
    if (typeof initNotification === 'function') initNotification();
    
    // Dashboard Stats ကို 30 seconds တခါ update လုပ်မယ်
    setInterval(() => {
        if(localStorage.getItem('activeView') === 'dashboard') {
            loadDashboardStats();
        }
    }, 30000); 
};
async function loadDashboardStats() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Today's Orders & Revenue
        const { data: orders, error: oErr } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', today);

        if (oErr) throw oErr;

        // Stats Calculation
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.order_status === 'Preparing').length;
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        const unpaidAmount = orders.filter(o => o.payment_status === 'Unpaid')
                                   .reduce((sum, o) => sum + Number(o.total_amount), 0);

        // 2. Profit Calculation (Using order_items and menu cost price)
        // Note: For advanced profit, we link order_items with menu cost_price
        const { data: items, error: iErr } = await supabase
            .from('order_items')
            .select('quantity, unit_price, product_id, menu(cost_price)')
            .gte('created_at', today);
        
        let totalProfit = 0;
        if (items) {
            totalProfit = items.reduce((sum, item) => {
                const cost = item.menu?.cost_price || 0;
                return sum + ((item.unit_price - cost) * item.quantity);
            }, 0);
        }

        // 3. Low Stock Check
        const { data: lowStock, count: lowCount } = await supabase
            .from('menu')
            .select('name, stock', { count: 'exact' })
            .lt('stock', 5);

        // UI Updates
        document.getElementById('stat-orders').innerText = totalOrders;
        document.getElementById('stat-pending').innerText = `${pendingOrders} Pending`;
        document.getElementById('stat-revenue').innerText = `${totalRevenue.toLocaleString()} K`;
        document.getElementById('stat-unpaid').innerText = `Unpaid: ${unpaidAmount.toLocaleString()} K`;
        document.getElementById('stat-profit').innerText = `${totalProfit.toLocaleString()} K`;
        document.getElementById('stat-lowstock').innerText = lowCount || 0;

        // Display Low Stock List
        const listDiv = document.getElementById('low-stock-list');
        listDiv.innerHTML = lowStock?.length ? lowStock.map(i => 
            `<div class="alert-item">⚠️ ${i.name} - Only <b>${i.stock}</b> left</div>`
        ).join('') : '<p class="success-text">All stocks are healthy ✅</p>';

    } catch (err) {
        console.error("Dashboard Error:", err.message);
    }
}
