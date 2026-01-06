// ၁။ လက်ရှိ Filter Status ကို သိမ်းရန်
let currentFilter = 'All';

// ၂။ Real-time အော်ဒါအသစ်ဝင်ရင် သိရှိရန် (Supabase Realtime)
const orderSubscription = supabase
    .channel('orders-realtime')
    .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders' 
    }, payload => {
        console.log('Change received!', payload);
        
        // အော်ဒါအသစ်ဝင်လျှင် အသံမြည်ပေးမည်
        if (payload.eventType === 'INSERT') {
            playNotificationSound();
            // Dashboard ရှိလျှင် Stat များကို Update လုပ်ရန်
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
        }
        
        // ဘာပြောင်းလဲမှုပဲဖြစ်ဖြစ် List ကို Update လုပ်မည်
        fetchOrders(); 
    })
    .subscribe();

// ၃။ အော်ဒါများကို ဆွဲထုတ်ခြင်း (Fetch Orders)
async function fetchOrders() {
    const orderContainer = document.getElementById('order-list');
    if (!orderContainer) return;

    try {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

        if (currentFilter !== 'All') {
            query = query.eq('order_status', currentFilter);
        }

        const { data: orders, error } = await query;
        if (error) throw error;

        if (orders.length === 0) {
            orderContainer.innerHTML = `<div class="empty-state">No ${currentFilter} orders found.</div>`;
            return;
        }

        orderContainer.innerHTML = orders.map(order => renderOrderCard(order)).join('');

    } catch (err) {
        console.error("Fetch Error:", err.message);
        orderContainer.innerHTML = `<p class="error">Error loading orders.</p>`;
    }
}

// ၄။ Order Card တစ်ခုချင်းစီ၏ HTML
function renderOrderCard(order) {
    let items = [];
    try { 
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; 
    } catch (e) { items = []; }

    const statusColors = {
        'Preparing': '#f1c40f', // Yellow
        'Ready': '#2ecc71',     // Green
        'Collected': '#3498db'  // Blue
    };
    const borderColor = statusColors[order.order_status] || '#eee';

    return `
    <div class="order-card" style="border-left: 6px solid ${borderColor}">
        <div class="order-header">
            <span><i class="fas fa-clock"></i> ${new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            <span class="status-badge" style="background: ${borderColor}; color: white; padding: 2px 8px; border-radius: 4px;">${order.order_status}</span>
        </div>
        
        <div class="customer-info">
            <strong><i class="fas fa-user"></i> ${order.customer_name || 'Guest'}</strong><br>
            <small><i class="fas fa-phone"></i> ${order.customer_phone || 'N/A'}</small>
        </div>

        <div class="order-items">
            ${items.map(i => `<p><strong>${i.qty || i.quantity}</strong> x ${i.name || 'Item'}</p>`).join('')}
        </div>

        <div class="order-footer">
            <p class="total-text">Total: <strong>${Number(order.total_amount).toLocaleString()} K</strong></p>
            <div class="status-buttons">
                <button class="status-btn ${order.order_status === 'Preparing' ? 'active-prep' : ''}" 
                    onclick="updateStatus('${order.id}', 'Preparing')">Prep</button>
                
                <button class="status-btn ${order.order_status === 'Ready' ? 'active-ready' : ''}" 
                    onclick="updateStatus('${order.id}', 'Ready')">Ready</button>
                
                <button class="status-btn done-btn" 
                    onclick="finalizeOrder('${order.id}', ${order.total_amount}, '${order.customer_phone}')">
                    <i class="fas fa-check-circle"></i> Done
                </button>
            </div>
        </div>
    </div>`;
}

// ၅။ အော်ဒါအသစ်တင်ခြင်း (Customer Checkout မှ ခေါ်ရန်)
async function processOrder(orderData, cartItems) {
    try {
        // Step 1: Insert into Orders
        const { data: newOrder, error: orderErr } = await supabase
            .from('orders')
            .insert([{
                customer_phone: orderData.phone,
                customer_name: orderData.name,
                total_amount: orderData.total,
                payment_method: orderData.paymentMethod,
                pickup_time: orderData.pickupTime,
                order_status: 'Preparing'
            }])
            .select().single();

        if (orderErr) throw orderErr;

        // Step 2: Insert into Order Items (Trigger က Stock ကို Auto နှုတ်ပါမည်)
        const orderItemsToInsert = cartItems.map(item => ({
            order_id: newOrder.id,
            product_id: item.id,
            quantity: item.qty || item.quantity,
            unit_price: item.price
        }));

        const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsToInsert);
        if (itemsErr) throw itemsErr;

        // Step 3: Loyalty points (Phone number ဖြင့်)
        await updateCustomerLoyalty(orderData.phone, orderData.total, orderData.name);

        alert("အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်။");
        return true;

    } catch (err) {
        console.error("Process Order Error:", err.message);
        alert("Error: " + err.message);
    }
}

// ၆။ Status ပြောင်းလဲခြင်း (Preparing/Ready)
async function updateStatus(orderId, newStatus) {
    const { error } = await supabase.from('orders').update({ order_status: newStatus }).eq('id', orderId);
    if (error) alert("Update Error: " + error.message);
}

// ၇။ အော်ဒါပိတ်သိမ်းခြင်း (Done ခလုတ်နှိပ်သောအခါ)
async function finalizeOrder(orderId, amount, customerPhone) {
    if (!confirm("အော်ဒါကို ပိတ်သိမ်းမလား?")) return;

    try {
        const { error } = await supabase.from('orders')
            .update({ order_status: 'Collected', payment_status: 'Paid' })
            .eq('id', orderId);

        if (error) throw error;
        alert("Order Completed!");

    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ၈။ Loyalty Points Update
async function updateCustomerLoyalty(phone, amount, name) {
    const earnedPoints = Math.floor(amount / 1000); // ၁၀၀၀ ကျပ် = ၁ မှတ်
    
    const { data: customer } = await supabase.from('customers').select('*').eq('phone_number', phone).single();

    if (customer) {
        await supabase.from('customers').update({
            points: (customer.points || 0) + earnedPoints,
            total_orders: (customer.total_orders || 0) + 1,
            total_spend: (Number(customer.total_spend) || 0) + Number(amount),
            last_order_date: new Date()
        }).eq('phone_number', phone);
    } else {
        await supabase.from('customers').insert([{
            phone_number: phone,
            full_name: name,
            points: earnedPoints,
            total_orders: 1,
            total_spend: amount
        }]);
    }
}

// ၉။ Filter Function
function setOrderFilter(status) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === status || (status === 'All' && btn.innerText === 'All'));
    });
    fetchOrders();
}

// ၁၀။ Helper Functions
function playNotificationSound() {
    new Audio('notification.mp3').play().catch(e => console.log("Sound muted"));
}

// စတင်ချိန်တွင် Order များကို Load လုပ်ရန်
document.addEventListener('DOMContentLoaded', fetchOrders);
