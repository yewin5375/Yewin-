// ၁။ Real-time စောင့်ကြည့်ခြင်း
const orderSubscription = supabase
  .channel('orders-realtime')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
    try { playNotificationSound(); } catch(e) {}
    fetchOrders(); 
  })
  .subscribe();

// ၂။ အော်ဒါစာရင်းကို ဆွဲထုတ်ခြင်း (Error ကင်းအောင် ပြင်ထားသည်)
async function fetchOrders() {
    const orderContainer = document.getElementById('order-list');
    if (!orderContainer) return;

    // Error တက်စေတဲ့ customers(name) ကို ဖြုတ်လိုက်ပြီး select('*') ပဲ သုံးထားပါတယ်
    const { data, error } = await supabase
        .from('orders')
        .select('*') 
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        orderContainer.innerHTML = `<p style="color:red; padding:20px;">Error: ${error.message}</p>`;
        return;
    }

    if (data.length === 0) {
        orderContainer.innerHTML = `<div class="loading-state"><p>အော်ဒါစာရင်း မရှိသေးပါ။</p></div>`;
        return;
    }

    orderContainer.innerHTML = data.map(order => {
        let items = [];
        try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch (e) { items = []; }

        return `
        <div class="order-card ${order.order_status === 'Collected' ? 'status-collected' : ''}" id="order-${order.id}">
            <div class="order-header">
                <span class="order-type">${order.order_type || 'BBQ Order'}</span>
                <span class="pickup-time">${new Date(order.created_at).toLocaleTimeString()}</span>
            </div>
            
            <div class="customer-link">
                <i class="fas fa-user-circle"></i>
                <strong>ID: ${order.customer_id || 'Guest Customer'}</strong>
            </div>

            <div class="order-items">
                ${items.map(item => `<p>${item.qty} x ${item.name}</p>`).join('')}
            </div>

            <div class="order-footer">
                <p>Total: <strong>${order.total_amount?.toLocaleString()} MMK</strong></p>
                <div class="status-buttons">
                    <button class="status-btn preparing ${order.order_status === 'Preparing' ? 'active' : ''}" onclick="updateStatus('${order.id}', 'Preparing')">Prep</button>
                    <button class="status-btn ready ${order.order_status === 'Ready' ? 'active' : ''}" onclick="updateStatus('${order.id}', 'Ready')">Ready</button>
                    <button class="status-btn collected" onclick="finalizeOrder('${order.id}')">Collect</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ၃။ Status Update
async function updateStatus(orderId, status) {
    const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
    if (!error) fetchOrders();
}

// ၄။ အော်ဒါပိတ်သိမ်းခြင်း
async function finalizeOrder(orderId) {
    if (confirm("ငွေလက်ခံရရှိပြီး အော်ဒါလွှဲပြောင်းပေးလိုက်ပြီလား?")) {
        const { error } = await supabase.from('orders')
            .update({ order_status: 'Collected', payment_status: 'Paid' })
            .eq('id', orderId);

        if (!error) {
            alert("အောင်မြင်ပါသည်။");
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







