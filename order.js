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
        // Database မှ အော်ဒါများ ဆွဲယူခြင်း
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

        // Filter status ရှိလျှင် စစ်ထုတ်မည်
        if (currentFilter !== 'All') {
            query = query.eq('order_status', currentFilter);
        }

        const { data: orders, error } = await query;

        if (error) throw error;

        // UI ကို Reset လုပ်ပြီး အသစ်ပြန်ထည့်ခြင်း
        if (orders.length === 0) {
            orderContainer.innerHTML = `<div class="empty-state">No ${currentFilter} orders found.</div>`;
            return;
        }

        orderContainer.innerHTML = orders.map(order => renderOrderCard(order)).join('');

    } catch (err) {
        console.error("Fetch Error:", err.message);
        orderContainer.innerHTML = `<p class="error">Error loading orders. Please try again.</p>`;
    }
}

// ၄။ Order Card တစ်ခုချင်းစီ၏ HTML ကို တည်ဆောက်ခြင်း
function renderOrderCard(order) {
    let items = [];
    try { 
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; 
    } catch (e) { 
        items = []; 
    }

    // Status အလိုက် Border အရောင်သတ်မှတ်ခြင်း
    const statusColors = {
        'Preparing': '#FFEAA7',
        'Ready': '#55E6C1',
        'Collected': '#FF4500'
    };
    const borderColor = statusColors[order.order_status] || '#eee';

    return `
    <div class="order-card" style="border-left: 6px solid ${borderColor}">
        <div class="order-header">
            <span><i class="fas fa-clock"></i> ${new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            <span class="status-badge" style="color: ${borderColor}">${order.order_status}</span>
        </div>
        
        <div class="customer-link" onclick="viewCustomerProfile('${order.customer_id}')">
            <strong><i class="fas fa-user-circle"></i> ID: ${order.customer_id || 'Guest'}</strong>
        </div>

        <div class="order-items">
            ${items.map(i => `<p><strong>${i.qty}</strong> x ${i.name}</p>`).join('')}
        </div>

        <div class="order-footer">
            <p class="total-text">Total: <strong>${Number(order.total_amount).toLocaleString()} K</strong></p>
            <div class="status-buttons">
                <button class="status-btn ${order.order_status === 'Preparing' ? 'active-prep' : ''}" 
                    onclick="updateStatus('${order.id}', 'Preparing')">Prep</button>
                
                <button class="status-btn ${order.order_status === 'Ready' ? 'active-ready' : ''}" 
                    onclick="updateStatus('${order.id}', 'Ready')">Ready</button>
                
                <button class="status-btn done-btn" 
                    onclick="finalizeOrder('${order.id}', ${order.total_amount}, '${order.customer_id}')">
                    <i class="fas fa-check-circle"></i> Done
                </button>
            </div>
        </div>
    </div>`;
}

// ၅။ Status ပြောင်းလဲခြင်း (Update Status)
async function updateStatus(orderId, newStatus) {
    const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

    if (error) {
        alert("Update Error: " + error.message);
    }
    // Realtime channel က အလိုအလျောက် fetchOrders() ပြန်ခေါ်ပေးလိမ့်မည်
}

// ၆။ အော်ဒါသိမ်းဆည်းခြင်းနှင့် Loyalty Point တွက်ချက်ခြင်း
async function finalizeOrder(orderId, amount, customerId) {
    if (!confirm("ငွေချေပြီးကြောင်း မှတ်တမ်းတင်ပြီး ဤအော်ဒါကို ပိတ်သိမ်းမလား?")) return;

    try {
        // ၁။ Order Status ကို Collected ပြောင်းမည်
        const { error: orderError } = await supabase
            .from('orders')
            .update({ order_status: 'Collected', payment_status: 'Paid' })
            .eq('id', orderId);

        if (orderError) throw orderError;

        // ၂။ Loyalty Points ပေးမည် (Customer ရှိလျှင်)
        if (customerId && customerId !== 'null' && customerId !== 'Guest') {
            await updateCustomerLoyalty(customerId, amount);
        }

        alert("Order Completed Successfully!");

    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ၇။ Customer ၏ Point များကို Update လုပ်ခြင်း
async function updateCustomerLoyalty(customerId, amount) {
    // ၁၀၀၀ ကျပ်လျှင် ၁ မှတ် တွက်ချက်သည်
    const earnedPoints = Math.floor(amount / 1000); 

    // လက်ရှိ Point ကို အရင်ယူသည်
    const { data: cust, error: fetchErr } = await supabase
        .from('customers')
        .select('total_points, lifetime_value')
        .eq('id', customerId)
        .single();

    if (cust) {
        const { error: updateErr } = await supabase
            .from('customers')
            .update({
                total_points: (cust.total_points || 0) + earnedPoints,
                lifetime_value: (cust.lifetime_value || 0) + amount
            })
            .eq('id', customerId);
        
        if (updateErr) console.error("Loyalty Update Error:", updateErr.message);
    }
}

// ၈။ Filter လုပ်ဆောင်ချက်
function setOrderFilter(status) {
    currentFilter = status;
    
    // ခလုတ်များ၏ Active ဖြစ်မှုကို ပြောင်းလဲခြင်း
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase() === status.toLowerCase() || (status === 'All' && btn.innerText === 'All')) {
            btn.classList.add('active');
        }
    });

    fetchOrders();
}

// ၉။ အသံနှင့် အခြား Helper Functions
function playNotificationSound() {
    const audio = new Audio('notification.mp3');
    audio.play().catch(e => console.log("Sound play blocked by browser"));
}

function viewCustomerProfile(customerId) {
    if (!customerId || customerId === 'null' || customerId === 'Guest') {
        return alert("Guest Customer အတွက် Profile မရှိပါ။");
    }
    // Customer profile view သို့ သွားရန် Logic
    changeNav('customers', null); 
    // viewCustomerDetail(customerId); // ရှိလျှင် ခေါ်ရန်
}

// စတင်ချိန်တွင် Order များကို Load လုပ်ရန်
document.addEventListener('DOMContentLoaded', fetchOrders);
