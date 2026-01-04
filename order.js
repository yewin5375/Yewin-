// ၁။ အော်ဒါအသစ်တက်လာသည်ကို Real-time စောင့်ကြည့်ခြင်း
const orderSubscription = supabase
  .channel('orders-realtime')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
    try { playNotificationSound(); } catch(e) {}
    fetchOrders(); 
  })
  .subscribe();

// ၂။ အော်ဒါစာရင်းကို ဆွဲထုတ်ခြင်း
async function fetchOrders() {
    const orderContainer = document.getElementById('order-list');
    if (!orderContainer) return;

    const { data, error } = await supabase
        .from('orders')
        .select('*, customers(name, total_points)') 
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    orderContainer.innerHTML = data.map(order => {
        let items = [];
        try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch (e) { items = []; }

        return `
        <div class="order-card ${order.order_status === 'Collected' ? 'status-collected' : ''}" id="order-${order.id}">
            <div class="order-header">
                <span class="order-type">${order.order_type || 'BBQ Order'}</span>
                <span class="pickup-time">${new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            
            <div class="customer-link" onclick="viewCustomerProfile('${order.customer_id}')">
                <i class="fas fa-user-circle"></i>
                <strong>${order.customers?.name || 'Guest'}</strong>
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

// ၃။ Deep Link - Customer Profile သို့ တိုက်ရိုက်သွားခြင်း
function viewCustomerProfile(customerId) {
    if (!customerId || customerId === 'null') return alert("Guest Customer ဖြစ်နေပါသည်");
    showPage('customer-page'); 
    viewCustomerDetail(customerId); 
}

// ၄။ Status Update
async function updateStatus(orderId, status) {
    await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
    fetchOrders();
}

async function finalizeOrder(orderId) {
    if (confirm("ငွေလက်ခံရရှိပြီး အော်ဒါလွှဲပြောင်းပေးလိုက်ပြီလား?")) {
        const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
        if (!order) return;

        const { error } = await supabase.from('orders')
            .update({ order_status: 'Collected', payment_status: 'Paid' })
            .eq('id', orderId);

        if (!error) {
            await updateCustomerLoyalty(order.customer_id, order.total_amount);
            alert("အောင်မြင်ပါသည်။");
            fetchOrders();
        }
    }
}

async function updateCustomerLoyalty(customerId, amount) {
    if (!customerId) return;
    const earnedPoints = Math.floor(amount / 1000); 
    const { data: cust } = await supabase.from('customers').select('*').eq('id', customerId).single();
    if (cust) {
        await supabase.from('customers').update({
            total_points: (cust.total_points || 0) + earnedPoints,
            lifetime_value: (cust.lifetime_value || 0) + amount
        }).eq('id', customerId);
    }
}

document.addEventListener('DOMContentLoaded', fetchOrders);
