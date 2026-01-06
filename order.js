// ၁။ လက်ရှိ Filter အခြေအနေကို သိမ်းဆည်းရန်
let currentFilter = 'All';

// ၂။ Real-time Order Listening (အော်ဒါအသစ်တက်ရင် အသံမြည်ပြီး List ပြန် Load လုပ်ရန်)
const orderChannel = supabase
    .channel('order-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        fetchOrders(); // List ကို အသစ်ပြန်တင်မည်
        if (payload.eventType === 'INSERT') {
            playNotificationSound(); // အသံမြည်ရန်
        }
    })
    .subscribe();

// ၃။ အော်ဒါများကို ဆွဲထုတ်ခြင်း (Fetch Orders with Filters)
async function fetchOrders() {
    const container = document.getElementById('order-list');
    if (!container) return;

    try {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

        // Filter အလုပ်လုပ်ပုံ (All, Preparing, Ready, Collected)
        if (currentFilter !== 'All') {
            query = query.eq('order_status', currentFilter);
        }

        const { data: orders, error } = await query;
        if (error) throw error;

        if (orders.length === 0) {
            container.innerHTML = `<div class="empty-state">No ${currentFilter} orders found.</div>`;
            return;
        }

        container.innerHTML = orders.map(order => renderOrderCard(order)).join('');
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}

// ၄။ Order Card UI (Professional View)
function renderOrderCard(order) {
    let items = [];
    try { 
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); 
    } catch (e) { items = []; }

    const statusColors = {
        'Preparing': '#f1c40f', // Yellow
        'Ready': '#2ecc71',     // Green
        'Collected': '#3498db'  // Blue
    };
    const color = statusColors[order.order_status] || '#95a5a6';

    return `
    <div class="order-card professional" style="border-left: 6px solid ${color}">
        <div class="order-header">
            <span class="order-id">#${order.id.toString().slice(-5)}</span>
            <span class="status-badge" style="background: ${color}">${order.order_status}</span>
        </div>
        
        <div class="customer-preview">
            <strong>${order.customer_name || 'Guest'}</strong>
            <span>${order.customer_phone || ''}</span>
        </div>

        <div class="item-list">
            ${items.map(i => `<div class="item-row"><span>${i.qty || i.quantity} x ${i.name}</span></div>`).join('')}
        </div>

        <div class="order-footer">
            <div class="total-section">
                <span class="label">Total</span>
                <span class="amount">${Number(order.total_amount).toLocaleString()} K</span>
            </div>
            <div class="action-buttons">
                <button class="btn-prep" onclick="updateStatus('${order.id}', 'Preparing')">Prep</button>
                <button class="btn-ready" onclick="updateStatus('${order.id}', 'Ready')">Ready</button>
                <button class="btn-done" onclick="finalizeOrder('${order.id}', ${order.total_amount}, '${order.customer_phone}')">
                    <i class="fas fa-check-double"></i> Done
                </button>
            </div>
        </div>
    </div>`;
}

// ၅။ Search & Filter Functions
function filterOrders() {
    const searchTerm = document.getElementById('order-search').value.toLowerCase();
    const cards = document.querySelectorAll('.order-card');
    
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

function setOrderFilter(status) {
    currentFilter = status;
    // UI Button highlight ပြောင်းရန်
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === status || (status === 'All' && btn.innerText === 'All'));
    });
    fetchOrders();
}

// ၆။ Status Update
async function updateStatus(orderId, newStatus) {
    const { error } = await supabase.from('orders').update({ order_status: newStatus }).eq('id', orderId);
    if (error) alert("Error: " + error.message);
}

// ၇။ Finalize Order & Loyalty Points Automation
async function finalizeOrder(orderId, amount, phone) {
    if (!confirm("Order သိမ်းဆည်းပြီး Points ပေးမလား?")) return;

    try {
        // Step 1: Status Update
        const { error } = await supabase.from('orders')
            .update({ order_status: 'Collected', payment_status: 'Paid' })
            .eq('id', orderId);

        if (error) throw error;

        // Step 2: Points Calculation (1,000 MMK = 1 Point)
        if (phone && phone !== 'Guest') {
            const pointsToAdd = Math.floor(amount / 1000);
            
            // Customer ရှိ/မရှိ စစ်ဆေးပြီး Point တိုးခြင်း
            const { data: customer } = await supabase.from('customers').select('points').eq('phone_number', phone).single();
            
            if (customer) {
                await supabase.from('customers').update({ 
                    points: (customer.points || 0) + pointsToAdd,
                    total_spend: supabase.rpc('increment', { row_id: phone, x: amount }) // Optional: increment function သုံးနိုင်သည်
                }).eq('phone_number', phone);
            }
        }
        alert("Success! Points Updated.");
    } catch (err) {
        alert("Error: " + err.message);
    }
}

function playNotificationSound() {
    new Audio('notification.mp3').play().catch(e => console.log("Sound muted"));
}

document.addEventListener('DOMContentLoaded', fetchOrders);
