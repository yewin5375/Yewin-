// ၁။ အော်ဒါအသစ်တက်လာသည်ကို Real-time စောင့်ကြည့်ခြင်း
const orderSubscription = supabase
  .channel('orders-realtime')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
    try { 
        // Notification Sound ထည့်လိုလျှင် ဒီမှာ သုံးနိုင်သည်
        console.log("New order received!", payload.new);
    } catch(e) {}
    fetchOrders(); 
  })
  .subscribe();
// အော်ဒါတင်သည့် နမူနာ Function
async function placeOrder(customerId, cartItems, totalAmount) {
    try {
        // ၁။ Customer ID '1' သည် တကယ်ရှိမရှိ အရင်စစ်ဆေးပါ
        const { data: customer, error: custError } = await supabase
            .from('customers')
            .select('id')
            .eq('id', customerId)
            .single();

        if (custError || !customer) {
            alert("Error: ဤ Customer ID မရှိသေးပါ။ အရင်စာရင်းသွင်းပါ သို့မဟုတ် Guest အနေဖြင့် တင်ပါ။");
            return;
        }

        // ၂။ Customer ရှိမှသာ အော်ဒါသွင်းပါ
        const orderData = {
            customer_id: customerId, // customers table ထဲမှာ အရင်ရှိနေရမည်
            items: JSON.stringify(cartItems),
            total_amount: totalAmount,
            order_status: 'Preparing',
            created_at: new Date().toISOString()
        };

        const { error: orderError } = await supabase.from('orders').insert([orderData]);

        if (orderError) throw orderError;
        alert("အော်ဒါ အောင်မြင်စွာ တင်ပြီးပါပြီ!");

    } catch (err) {
        console.error("Order Error:", err.message);
        alert("အော်ဒါတင်၍ မရပါ- " + err.message);
    }
}
// ၂။ အော်ဒါစာရင်းကို ဆွဲထုတ်ခြင်း
async function fetchOrders() {
    const orderContainer = document.getElementById('order-list');
    if (!orderContainer) return;

    const { data, error } = await supabase
        .from('orders')
        .select('*, customers(name, total_points)') 
        .order('created_at', { ascending: false });

    if (error) {
        orderContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        return;
    }

    if (data.length === 0) {
        orderContainer.innerHTML = '<div class="loading-state"><p>အော်ဒါအသစ် မရှိသေးပါ။</p></div>';
        return;
    }

    orderContainer.innerHTML = data.map(order => {
        let items = [];
        try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch (e) { items = []; }

        // Status အလိုက် Card အရောင်ပြောင်းရန် (CSS နှင့် ချိတ်ဆက်သည်)
        const statusClass = order.order_status === 'Collected' ? 'status-collected' : '';
        
        return `
        <div class="order-card ${statusClass}" id="order-${order.id}">
            <div class="order-header">
                <span class="order-type">#${order.id.toString().slice(-4)} ${order.order_type || 'Takeaway'}</span>
                <span class="pickup-time">${new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            
            <div class="customer-link" onclick="viewCustomerProfile('${order.customer_id}')">
                <i class="fas fa-user-circle"></i>
                <strong>${order.customers?.name || 'Guest'}</strong>
            </div>

            <div class="order-items">
                ${items.map(item => `<p>• ${item.qty} x ${item.name}</p>`).join('')}
            </div>

            <div class="order-footer">
                <p>Total: <strong>${order.total_amount?.toLocaleString()} MMK</strong></p>
                <div class="status-buttons">
                    <button class="status-btn preparing ${order.order_status === 'Preparing' ? 'active' : ''}" 
                        onclick="updateStatus('${order.id}', 'Preparing')">Prep</button>
                    <button class="status-btn ready ${order.order_status === 'Ready' ? 'active' : ''}" 
                        onclick="updateStatus('${order.id}', 'Ready')">Ready</button>
                    <button class="status-btn collected" 
                        onclick="finalizeOrder('${order.id}')">Collect</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ၃။ Status Update Function
async function updateStatus(orderId, status) {
    const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
    if (!error) fetchOrders();
}

// ၄။ အော်ဒါအပြီးသတ်ခြင်း (Points တွက်ချက်ခြင်း အပါအဝင်)
async function finalizeOrder(orderId) {
    if (confirm("ငွေလက်ခံရရှိပြီး အော်ဒါလွှဲပြောင်းပေးလိုက်ပြီလား?")) {
        const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
        if (!order) return;

        const { error } = await supabase.from('orders')
            .update({ order_status: 'Collected', payment_status: 'Paid' })
            .eq('id', orderId);

        if (!error) {
            await updateCustomerLoyalty(order.customer_id, order.total_amount);
            alert("Order Collected!");
            fetchOrders();
        }
    }
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
