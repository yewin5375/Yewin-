// ၁။ အော်ဒါအသစ်တက်လာသည်ကို Real-time စောင့်ကြည့်ခြင်း
const orderSubscription = supabase
  .channel('orders-realtime')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
    playNotificationSound(); // အသံမြည်စေရန်
    fetchOrders(); // စာရင်းပြန်ဖွင့်ရန်
  })
  .subscribe();

// ၂။ အော်ဒါစာရင်းကို ဆွဲထုတ်ခြင်း
async function fetchOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select('*, customers(full_name, total_points)') // Deep Link အတွက် customer data ပါ ဆွဲထုတ်သည်
        .order('pickup_time', { ascending: true });

    if (error) return console.error(error);

    const orderContainer = document.getElementById('order-list');
    orderContainer.innerHTML = data.map(order => `
        <div class="order-card ${order.is_locked ? 'locked' : ''}" id="order-${order.id}">
            <div class="order-header">
                <span class="order-type">${order.order_type}</span>
                <span class="pickup-time">${new Date(order.pickup_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            
            <div class="customer-link" onclick="viewCustomerProfile('${order.customer_id}')">
                <i class="fas fa-user-circle"></i>
                <strong>${order.customers?.full_name || 'Guest'}</strong>
            </div>

            <div class="order-items">
                ${JSON.parse(order.items).map(item => `<p>${item.qty} x ${item.name}</p>`).join('')}
            </div>

            <div class="order-footer">
                <div class="status-buttons">
                    <button class="status-btn preparing ${order.order_status === 'Preparing' ? 'active' : ''}" onclick="updateStatus('${order.id}', 'Preparing')">Prep</button>
                    <button class="status-btn ready ${order.order_status === 'Ready' ? 'active' : ''}" onclick="updateStatus('${order.id}', 'Ready')">Ready</button>
                    <button class="status-btn collected" onclick="finalizeOrder('${order.id}')">Collect</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ၃။ Deep Link - Customer Profile သို့ တိုက်ရိုက်သွားခြင်း
function viewCustomerProfile(customerId) {
    // Customer Page သို့ ပြောင်းပြီး အချက်အလက်ပြရန်
    showPage('customer-page'); 
    loadCustomerInsights(customerId); // customer.js ရှိ function ကို လှမ်းခေါ်ခြင်း
}

// ၄။ Order Locking Logic
async function updateStatus(orderId, status) {
    // အခြားသူ ဝင်မပြင်နိုင်ရန် Lock ချခြင်း
    const { error } = await supabase
        .from('orders')
        .update({ order_status: status, is_locked: true, locked_by: 'Admin' })
        .eq('id', orderId);

    if (!error) fetchOrders();
}

// ၅။ အသံသတိပေးချက်ပေးခြင်း
function playNotificationSound() {
    const audio = new Audio('notification.mp3'); // အစ်ကို့ဆီမှာ ရှိမယ့် အသံဖိုင်
    audio.play();
}

