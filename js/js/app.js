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
function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');

    if (id === 'orders') loadOrders();
    if (id === 'customers') loadCustomers();
    if (id === 'dashboard') loadDashboard();
}

// App စတက်တာနဲ့ Dashboard ကို ခေါ်မယ်
window.onload = loadDashboard;

