// ၁။ Real-time စောင့်ကြည့်ခြင်း
const orderSubscription = supabase
  .channel('orders-realtime')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
    try { playNotificationSound(); } catch(e) {}
    fetchOrders(); 
  })
  .subscribe();

// အော်ဒါအဆင့်ပြောင်းလဲခြင်း (Prep, Ready, Done အတွက်)
async function updateStatus(orderId, status) {
    console.log("Updating Status:", orderId, status); // အလုပ်လုပ်၊ မလုပ် စစ်ရန်
    const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId);

    if (error) {
        alert("Error: " + error.message);
    } else {
        fetchOrders(); // အောင်မြင်ရင် စာရင်းပြန်ပြောင်း
    }
}

// Order တွေကို နေရာတကျ ပြသခြင်း
async function fetchOrders() {
    const orderContainer = document.getElementById('order-list');
    if (!orderContainer) return;

    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (error) return console.error(error);

    orderContainer.innerHTML = data.map(order => {
        let items = [];
        try { items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch (e) { items = []; }

        return `
        <div class="order-card">
            <div class="order-header">
                <strong>Pickup: ${new Date(order.created_at).toLocaleTimeString()}</strong>
                <span style="color:orange">${order.order_status}</span>
            </div>
            <div class="order-items" style="margin: 10px 0;">
                ${items.map(i => `<p>${i.qty} x ${i.name}</p>`).join('')}
            </div>
            <div class="status-buttons" style="display:flex; gap:5px;">
                <button class="status-btn" style="background:#ffeaa7" onclick="updateStatus('${order.id}', 'Preparing')">Prep</button>
                <button class="status-btn" style="background:#55e6c1" onclick="updateStatus('${order.id}', 'Ready')">Ready</button>
                <button class="status-btn" style="background:#ff7675; color:white;" onclick="updateStatus('${order.id}', 'Collected')">Done</button>
            </div>
        </div>`;
    }).join('');
}

// ၃။ Status Update
// အော်ဒါအဆင့်ပြောင်းလဲခြင်း (Prep, Ready, Done အတွက်)
async function updateStatus(orderId, status) {
    console.log("Updating Status:", orderId, status); // အလုပ်လုပ်၊ မလုပ် စစ်ရန်
    const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId);

    if (error) {
        alert("Error: " + error.message);
    } else {
        fetchOrders(); // အောင်မြင်ရင် စာရင်းပြန်ပြောင်း
    }
}
// ၄။ အော်ဒါပိတ်သိမ်းခြင်း
async function finalizeOrder(orderId) {
    if (confirm("ဒီအော်ဒါကို ငွေချေပြီးကြောင်း မှတ်တမ်းတင်မလား?")) {
        const { error } = await supabase
            .from('orders')
            .update({ order_status: 'Collected', payment_status: 'Paid' })
            .eq('id', orderId);

        if (error) {
            alert("အော်ဒါပိတ်လို့မရပါ: " + error.message);
        } else {
            fetchOrders();
        }
    }
}
function playNotificationSound() {
    const audio = new Audio('notification.mp3');
    audio.play();
}
// ၅။ Loyalty Points Update လုပ်ခြင်း
async function updateCustomerLoyalty(customerId, amount) {
    if (!customerId || customerId === 'null') return;
    const earnedPoints = Math.floor(amount / 1000); 
    const { data: cust } = await supabase.from('customers').select('*').eq('id', customerId).single();
    if (cust) {
        await supabase.from('customers').update({
            total_points: (cust.total_points || 0) + earnedPoints,
            lifetime_value: (cust.lifetime_value || 0) + amount
        }).eq('id', customerId);
    }
}
// ၆။ Customer Profile သို့သွားခြင်း
function viewCustomerProfile(customerId) {
    if (!customerId || customerId === 'null' || customerId === 'undefined') {
        return alert("Guest Customer ဖြစ်နေပါသည်");
    }
    showPage('customer-page'); 
    // customer.js ထဲရှိ function ကို လှမ်းခေါ်ခြင်း
    if (typeof viewCustomerDetail === 'function') viewCustomerDetail(customerId); 
}
document.addEventListener('DOMContentLoaded', fetchOrders);







