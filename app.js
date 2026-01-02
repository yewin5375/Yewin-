// js/app.js

async function loadDashboard() {
    console.log("Dashboard loading...");
    
    // sb ရှိမရှိ အရင်စစ်မယ်
    if (typeof sb === 'undefined') {
        alert("Supabase ချိတ်ဆက်မှု မရှိသေးပါ။ js/supabase.js ကို စစ်ဆေးပါ။");
        return;
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await sb
            .from('orders')
            .select('*');

        if (error) throw error;

        console.log("Data received:", data);

        document.getElementById('todayOrders').innerText = data.length + " Orders";
        
        const total = data.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        document.getElementById('todayRevenue').innerText = total.toLocaleString() + " Ks";

    } catch (err) {
        console.error("Error Detail:", err);
        alert("Data ဆွဲယူရာတွင် မှားယွင်းနေပါသည်။ Console ကိုကြည့်ပါ။");
    }
}

// စာမျက်နှာ ပြောင်းလဲခြင်း Logic
// app.js

function showView(id) {
    // View အားလုံးကို ဖျောက်မယ်
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // ရွေးလိုက်တဲ့ view တစ်ခုပဲ ပြမယ်
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
    }

    // Orders view ဖြစ်ရင် data ကို ခေါ်မယ်
    if (id === 'orders') {
        if (typeof loadOrders === 'function') {
            loadOrders();
        } else {
            console.error("loadOrders function ကို ရှာမတွေ့ပါ။ orders.js ကို စစ်ပါ။");
        }
    }
    
    if (id === 'dashboard') loadDashboard();
    if (id === 'customers') loadCustomers();
}

async function loadDashboard() {
    if (!window.sb) return;
    const { data, error } = await window.sb.from('orders').select('*');
    if (!error) {
        document.getElementById('todayOrders').innerText = data.length + " Orders";
        const total = data.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        document.getElementById('todayRevenue').innerText = total.toLocaleString() + " Ks";
    }
}

// app.js (Notification အပိုင်း)

const firebaseConfig = {
  apiKey: "AIzaSyCW_jACdwWmN2nwlEOxR6tdTBqLXHyvE0w",
  authDomain: "myin-thar-chicken-bbq.firebaseapp.com",
  projectId: "myin-thar-chicken-bbq",
  storageBucket: "myin-thar-chicken-bbq.firebasestorage.app",
  messagingSenderId: "45639130854",
  appId: "1:45639130854:web:779ecef328580d10e9e527"
};

// Initialize Firebase
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
                console.log("Token ရပြီ:", token);
                // Supabase ထဲမှာ Token သွားသိမ်းမယ် (Conflict ဖြစ်ရင် Update လုပ်မယ်)
                await window.sb.from('user_tokens').upsert([{ token: token }], { onConflict: 'token' });
            }
        }
    } catch (error) {
        console.log("Notification Error:", error);
    }
}

// မူလရှိပြီးသား window.onload ထဲမှာ ဒါလေး ထပ်ထည့်ပါ
const originalOnload = window.onload;
window.onload = function() {
    if (originalOnload) originalOnload();
    initNotification(); // Notification စဖွင့်မယ်
};


