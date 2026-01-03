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

let currentCart = [];

// ၁။ အော်ဒါတင်မည့် Modal ကို ဖွင့်ခြင်း
function openOrderModal() {
    currentCart = [];
    renderCart();
    document.getElementById('orderModal').style.display = 'flex';
    loadMenuToOrder(); // Menu list ကို Modal ထဲမှာ ပြဖို့
}

// ၂။ Customer အချက်အလက် ရှာဖွေခြင်း (Smart Search)
async function lookupCustomer(phone) {
    if (phone.length < 7) return;
    const { data, error } = await window.sb
        .from('customers')
        .select('full_name')
        .eq('phone_number', phone)
        .single();
    
    if (data) {
        document.getElementById('cName').value = data.full_name;
        document.getElementById('customerMsg').innerText = "VIP Customer ပြန်ရောက်လာပါပြီ! ✨";
    }
}

// ၃။ Menu များကို ရွေးချယ်နိုင်အောင် ပြသခြင်း
async function loadMenuToOrder() {
    const { data } = await window.sb.from('menu').select('*').eq('is_available', true);
    const menuGrid = document.getElementById('itemSelectionGrid');
    menuGrid.innerHTML = data.map(item => `
        <div class="selection-item" onclick="addToCart(${JSON.stringify(item).replace(/'/g, "&apos;")})">
            <span>${item.name}</span>
            <small>${item.price} Ks</small>
        </div>
    `).join('');
}

// ၄။ Cart ထဲသို့ ပစ္စည်းထည့်ခြင်း
function addToCart(item) {
    const existing = currentCart.find(i => i.id === item.id);
    if (existing) {
        existing.qty++;
    } else {
        currentCart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
    }
    renderCart();
}

// ၅။ Cart ထဲက စာရင်းကို ပြသခြင်း
function renderCart() {
    const cartDiv = document.getElementById('selectedItemsList');
    let total = 0;
    cartDiv.innerHTML = currentCart.map((item, index) => {
        total += item.price * item.qty;
        return `
            <div class="cart-row">
                <span>${item.name} x ${item.qty}</span>
                <span>${(item.price * item.qty).toLocaleString()} Ks</span>
                <button onclick="removeFromCart(${index})">❌</button>
            </div>
        `;
    }).join('');
    document.getElementById('orderTotalAmount').innerText = total.toLocaleString() + " Ks";
}

function removeFromCart(index) {
    currentCart.splice(index, 1);
    renderCart();
}

// ၆။ အော်ဒါ သိမ်းဆည်းခြင်း (Final Save)
async function submitOrder() {
    const phone = document.getElementById('cPhone').value;
    const name = document.getElementById('cName').value;
    const pTime = document.getElementById('pickupTime').value;
    const pMethod = document.getElementById('payMethod').value;
    const pStatus = document.getElementById('payStatus').value;
    
    if (!phone || !pTime || currentCart.length === 0) return alert("အချက်အလက် ပြည့်စုံအောင်ဖြည့်ပါ!");

    const total = currentCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    try {
        // Customer Profile ကို အရင် Update/Insert လုပ်မယ် (VIP Points အတွက်)
        await window.sb.from('customers').upsert([
            { phone_number: phone, full_name: name }
        ], { onConflict: 'phone_number' });

        // Order တင်မယ်
        const { error } = await window.sb.from('orders').insert([{
            customer_phone: phone,
            customer_name: name,
            items: currentCart,
            total_amount: total,
            pickup_time: pTime,
            payment_method: pMethod,
            payment_status: pStatus
        }]);

        if (error) throw error;
        alert("ဘောက်ချာ ထုတ်ပြီးပါပြီ!");
        document.getElementById('orderModal').style.display = 'none';
        loadOrders();
    } catch (e) { alert(e.message); }
                                      }
