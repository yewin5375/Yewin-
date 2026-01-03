// ၁။ အော်ဒါများကို ဆွဲထုတ်ပြသခြင်း
async function loadOrders() {
    try {
        const { data, error } = await window.sb
            .from('orders')
            .select('*')
            .order('pickup_time', { ascending: true }); // လာယူမယ့်အချိန် အစောဆုံးကို အပေါ်ကပြမယ်

        if (error) throw error;

        const orderList = document.getElementById('order-list');
        if (!orderList) return;

        if (data.length === 0) {
            orderList.innerHTML = "<p style='text-align:center; padding:20px;'>ယနေ့အတွက် အော်ဒါမရှိသေးပါ။</p>";
            return;
        }

        orderList.innerHTML = data.map(order => `
            <div class="order-card ${order.order_status.toLowerCase()}">
                <div class="order-header">
                    <div class="customer-info">
                        <span class="order-id">#${order.id.toString().slice(-4)}</span>
                        <h4>${order.customer_name}</h4>
                        <p>${order.customer_phone}</p>
                    </div>
                    <div class="pickup-tag">
                        <small>Pick-up Time</small>
                        <strong>${new Date(order.pickup_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                    </div>
                </div>

                <div class="order-items">
                    ${renderOrderItems(order.items)}
                </div>

                <div class="order-footer">
                    <div class="payment-box">
                        <span class="total">${Number(order.total_amount).toLocaleString()} Ks</span>
                        <span class="pay-status ${order.payment_status.toLowerCase()}">${order.payment_status}</span>
                    </div>
                    
                    <div class="order-actions">
                        ${renderStatusButtons(order)}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Order Load Error:", e.message);
    }
}

// ၂။ မှာယူထားသော ပစ္စည်းများစာရင်းကို ဖော်ပြခြင်း
function renderOrderItems(items) {
    // items သည် JSONB format ဖြစ်သောကြောင့် parse လုပ်ရန်
    const itemList = typeof items === 'string' ? JSON.parse(items) : items;
    return itemList.map(i => `<span>${i.name} x ${i.qty}</span>`).join(', ');
}

// ၃။ Status ခလုတ်များ (Preparing -> Ready -> Collected)
function renderStatusButtons(order) {
    if (order.order_status === 'Preparing') {
        return `<button class="btn-ready" onclick="updateOrderStatus(${order.id}, 'Ready')">🔔 Mark Ready</button>`;
    } else if (order.order_status === 'Ready') {
        return `<button class="btn-collected" onclick="updateOrderStatus(${order.id}, 'Collected')">✅ Collected</button>`;
    } else {
        return `<span class="status-done">Completed ✨</span>`;
    }
}

// ၄။ Status Update လုပ်ခြင်းနှင့် Notification ပို့ခြင်း
async function updateOrderStatus(orderId, newStatus) {
    try {
        const { error } = await window.sb
            .from('orders')
            .update({ order_status: newStatus })
            .eq('id', orderId);

        if (error) throw error;

        if (newStatus === 'Ready') {
            alert("အော်ဒါအဆင်သင့်ဖြစ်ကြောင်း Customer ဆီ Noti ပို့လိုက်ပါပြီ!");
            // ဤနေရာတွင် Firebase Notification Logic ကို ထည့်သွင်းပါမည်
        }

        loadOrders(); // List ကို Update ပြန်လုပ်မယ်
    } catch (e) {
        alert("Status Update Error: " + e.message);
    }
}

