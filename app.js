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

async function initNotification() {
    try {
        console.log("Notification ခွင့်ပြုချက် တောင်းခံနေသည်...");
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log("ခွင့်ပြုချက် ရရှိပါပြီ။ Token ထုတ်ယူနေသည်...");
            
            // Service Worker အဆင်သင့်ဖြစ်မဖြစ် အရင်စစ်မယ်
            const registration = await navigator.serviceWorker.ready;
            
            const token = await messaging.getToken({
                serviceWorkerRegistration: registration,
                vapidKey: "BKEpbLekJWc0eS5TDIKyB-Wp79lnfff9wF3ivDJj0LQG_s5Z7R2kKasvRAOaMvTxkRS6rkPfdIqLaIqR50O46xY"
            });

            if (token) {
                console.log("Token ရရှိပါပြီ -", token);
                // Supabase ထဲ သိမ်းဆည်းမယ်
                const { data, error } = await window.sb
                    .from('user_tokens')
                    .upsert([{ token: token }], { onConflict: 'token' });

                if (error) {
                    console.error("Supabase သိမ်းဆည်းရာတွင် အမှားရှိသည် -", error.message);
                } else {
                    console.log("Database ထဲသို့ Token သိမ်းဆည်းပြီးပါပြီ!");
                }
            } else {
                console.warn("Token မရရှိပါ။ Notification ခွင့်ပြုချက်ကို ပြန်စစ်ပါ။");
            }
        } else {
            console.warn("အသုံးပြုသူက Notification ကို ငြင်းပယ်ထားသည်။");
        }
    } catch (e) {
        console.error("Notification Error အသေးစိတ် -", e);
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

