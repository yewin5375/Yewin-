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

// ၁။ Navigation System (စာမျက်နှာများ ကူးပြောင်းခြင်း)
function changeNav(pageId, element) {
    // စာမျက်နှာအားလုံးကို ဖျောက်မည်
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    
    // ရွေးချယ်ထားသော စာမျက်နှာကို ပြမည်
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.remove('hidden');

    // Nav Item အရောင်ပြောင်းမည်
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (element) element.classList.add('active');

    // Dashboard ဆိုလျှင် Stats များကို Update လုပ်မည်
    if (pageId === 'dashboard') {
        updateDashboardStats();
    }
}

// ၂။ Dashboard Stats Update လုပ်ခြင်း (Analytics & Automation)
async function updateDashboardStats() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // ၂.၁ Today's Orders & Revenue ကို ဆွဲယူခြင်း
        const { data: orders, error: oErr } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', today);

        if (oErr) throw oErr;

        // ၂.၂ Profit တွက်ချက်ခြင်း (Order Items + Menu Join လုပ်ခြင်း)
        // မှတ်ချက်- menu table ထဲတွင် cost_price ရှိရန် လိုအပ်သည်
        const { data: orderItems, error: iErr } = await supabase
            .from('order_items')
            .select('quantity, unit_price, menu(cost_price)')
            .gte('created_at', today);

        const revenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        const pendingCount = orders.filter(o => o.order_status === 'Preparing').length;
        const unpaidSum = orders.filter(o => o.payment_status === 'Unpaid').reduce((sum, o) => sum + Number(o.total_amount), 0);

        // အမြတ်တွက်ချက်မှု (ရောင်းဈေး - ရင်းဈေး)
        let totalProfit = 0;
        if (orderItems) {
            totalProfit = orderItems.reduce((sum, item) => {
                const cost = item.menu?.cost_price || 0;
                return sum + ((item.unit_price - cost) * item.quantity);
            }, 0);
        }

        // ၂.၃ UI ပေါ်တွင် ဂဏန်းများ ပြောင်းလဲခြင်း
        document.getElementById('stat-orders').innerText = orders.length;
        document.getElementById('stat-revenue').innerText = revenue.toLocaleString() + " K";
        document.getElementById('stat-pending').innerText = `${pendingCount} Pending`;
        document.getElementById('stat-unpaid').innerText = `Unpaid: ${unpaidSum.toLocaleString()} K`;
        document.getElementById('stat-profit').innerText = totalProfit.toLocaleString() + " K";

        // ၂.၄ Low Stock Alerts (လက်ကျန် ၅ ခုအောက် ပစ္စည်းများ စစ်ဆေးခြင်း)
        checkLowStock();

    } catch (err) {
        console.error("Dashboard Stats Error:", err.message);
    }
}

// ၃။ Inventory Alerts (Automation)
async function checkLowStock() {
    const { data: lowItems, error } = await supabase
        .from('menu')
        .select('name, stock')
        .lt('stock', 5);

    const alertList = document.getElementById('low-stock-list');
    const lowStockCount = document.getElementById('stat-lowstock');

    if (error) return;

    if (lowItems.length > 0) {
        lowStockCount.innerText = lowItems.length;
        alertList.innerHTML = lowItems.map(item => `
            <div class="alert-item">
                <span>⚠️ ${item.name}</span>
                <span class="stock-badge">ကျန်: ${item.stock}</span>
            </div>
        `).join('');
    } else {
        lowStockCount.innerText = "0";
        alertList.innerHTML = `<p class="empty-msg">✅ ပစ္စည်းအားလုံး လက်ကျန် အဆင်ပြေပါသည်။</p>`;
    }
}

// ၄။ Initial Load
document.addEventListener('DOMContentLoaded', () => {
    updateDashboardStats();
    
    // Real-time Update (Database ထဲ data အပြောင်းအလဲရှိတိုင်း Dashboard ကို auto refresh လုပ်ရန်)
    supabase.channel('dashboard-auto-update')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
            updateDashboardStats();
        })
        .subscribe();
});
