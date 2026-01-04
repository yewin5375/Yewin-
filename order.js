// ၁။ Real-time အော်ဒါအသစ်ဝင်ရင် အသံမြည်ပြီး list update လုပ်ခြင်း
const orderSubscription = supabase
  .channel('orders-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
    if (payload.eventType === 'INSERT') {
        try { playNotificationSound(); } catch(e) {}
    }
    fetchOrders(); // ဘယ်အပြောင်းအလဲမဆို list ကို update လုပ်မယ်
  })
  .subscribe();

// ၂။ Filter လုပ်ရန် လက်ရှိ status ကို မှတ်ထားခြင်း
let currentFilter = 'All';

function filterOrders(status) {
    currentFilter = status;
    // UI ခလုတ်တွေကို အရောင်ပြောင်းခြင်း
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.includes(status)) btn.classList.add('active');
    });
    fetchOrders();
}

// ၃။ အော်ဒါများကို ဆွဲထုတ်ခြင်း
// အော်ဒါစာရင်း ဆွဲထုတ်ခြင်း
async function fetchOrders() {
    const orderContainer = document.getElementById('order-list');
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (error) return console.error(error);

    orderContainer.innerHTML = data.map(order => {
        let items = [];
        try { items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch (e) { items = []; }

        return `
        <div class="order-card">
            <div class="order-header">
                <span><i class="fas fa-clock"></i> ${new Date(order.created_at).toLocaleTimeString()}</span>
                <span style="color:#FF4500">${order.order_status}</span>
            </div>
            <div class="customer-link">
                <strong><i class="fas fa-user"></i> ID: ${order.customer_id || 'Guest'}</strong>
            </div>
            <div class="order-items">
                ${items.map(i => `<p><strong>${i.qty}</strong> x ${i.name}</p>`).join('')}
            </div>
            <div class="order-footer">
                <p>Total: <strong>${order.total_amount?.toLocaleString()} K</strong></p>
                <div class="status-buttons">
                    <button class="status-btn ${order.order_status === 'Preparing' ? 'active-prep' : ''}" 
                        onclick="updateStatus('${order.id}', 'Preparing')">Prep</button>
                    <button class="status-btn ${order.order_status === 'Ready' ? 'active-ready' : ''}" 
                        onclick="updateStatus('${order.id}', 'Ready')">Ready</button>
                    <button class="status-btn done" 
                        onclick="updateStatus('${order.id}', 'Collected')">Done</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// Status Update လုပ်သည့် Function
async function updateStatus(orderId, newStatus) {
    const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

    if (error) {
        alert("အမှားရှိနေပါသည်: " + error.message);
    } else {
        fetchOrders(); // List ကို ချက်ချင်း ပြန်ပြောင်းရန်
    }
}

// ၅။ အော်ဒါပိတ်သိမ်းခြင်းနှင့် Loyalty Points ပေးခြင်း
async function finalizeOrder(orderId, amount, customerId) {
    if (confirm("ဒီအော်ဒါကို ငွေချေပြီးကြောင်း မှတ်တမ်းတင်မလား?")) {
        const { error } = await supabase.from('orders')
            .update({ order_status: 'Collected', payment_status: 'Paid' })
            .eq('id', orderId);

        if (!error) {
            // Loyalty point update လုပ်မယ်
            if (customerId && customerId !== 'null') {
                await updateCustomerLoyalty(customerId, amount);
            }
            fetchOrders();
        } else {
            alert(error.message);
        }
    }
}

async function updateCustomerLoyalty(customerId, amount) {
    const earnedPoints = Math.floor(amount / 1000); 
    const { data: cust } = await supabase.from('customers').select('*').eq('id', customerId).single();
    if (cust) {
        await supabase.from('customers').update({
            total_points: (cust.total_points || 0) + earnedPoints,
            lifetime_value: (cust.lifetime_value || 0) + amount
        }).eq('id', customerId);
    }
}

function playNotificationSound() {
    const audio = new Audio('notification.mp3');
    audio.play();
}

function viewCustomerProfile(customerId) {
    if (!customerId || customerId === 'null') return alert("Guest Customer ဖြစ်နေပါသည်");
    showPage('customer-page');
    if (typeof viewCustomerDetail === 'function') viewCustomerDetail(customerId);
}

document.addEventListener('DOMContentLoaded', fetchOrders);
