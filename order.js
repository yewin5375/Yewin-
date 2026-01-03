let currentCart = [];

// === ၁။ အော်ဒါများကို ဆွဲထုတ်ပြသခြင်း (Live Orders View) ===
async function loadOrders() {
    try {
        const { data, error } = await window.sb
            .from('orders')
            .select('*')
            .order('pickup_time', { ascending: true });

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
                        <h4>${order.customer_name || 'ဧည့်သည်'}</h4>
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

function renderOrderItems(items) {
    const itemList = typeof items === 'string' ? JSON.parse(items) : items;
    return itemList.map(i => `<span>${i.name} x ${i.qty}</span>`).join(', ');
}

function renderStatusButtons(order) {
    if (order.order_status === 'Preparing') {
        return `<button class="btn-ready" onclick="updateOrderStatus(${order.id}, 'Ready')">🔔 Mark Ready</button>`;
    } else if (order.order_status === 'Ready') {
        return `<button class="btn-collected" onclick="updateOrderStatus(${order.id}, 'Collected')">✅ Collected</button>`;
    } else {
        return `<span class="status-done">Completed ✨</span>`;
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const { error } = await window.sb
            .from('orders')
            .update({ order_status: newStatus })
            .eq('id', orderId);

        if (error) throw error;
        loadOrders(); 
    } catch (e) {
        alert("Status Update Error: " + e.message);
    }
}

// === ၂။ Admin POS (အော်ဒါအသစ်ဖွင့်ခြင်း) ===

function openOrderModal() {
    currentCart = [];
    renderCart();
    
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // အော်ဒါပြင်ချိန် မိနစ် ၃၀ ကြိုပေးထားမယ်
    document.getElementById('pickupTime').value = now.toISOString().slice(0, 16);
    
    document.getElementById('orderModal').style.display = 'flex';
    document.getElementById('cPhone').value = "";
    document.getElementById('cName').value = "";
    document.getElementById('customerMsg').innerText = "";
    loadMenuToOrder(); 
}

async function lookupCustomer(phone) {
    if (phone.length >= 7) {
        const { data } = await window.sb
            .from('customers')
            .select('full_name')
            .eq('phone_number', phone)
            .maybeSingle();
        
        if (data) {
            document.getElementById('cName').value = data.full_name;
            document.getElementById('customerMsg').innerText = "✅ VIP Customer";
        } else {
            document.getElementById('customerMsg').innerText = "🆕 New Customer";
        }
    }
}

// Menu များကို ပုံနှင့်တကွ ဆွဲထုတ်ပြသခြင်း
async function loadMenuToOrder() {
    const menuGrid = document.getElementById('itemSelectionGrid');
    if (!menuGrid) return;

    try {
        const { data, error } = await window.sb.from('menu').select('*');
        if (error) throw error;

        menuGrid.innerHTML = data.map(item => {
            const imgTag = item.image_url 
                ? `<img src="${item.image_url}" class="mini-thumb">` 
                : `<div class="mini-thumb-empty">🍗</div>`;

            return `
                <div class="selection-item" onclick='handleAddToCart(${JSON.stringify(item)})'>
                    ${imgTag}
                    <div class="selection-info">
                        <span>${item.name}</span>
                        <small>${Number(item.price).toLocaleString()} Ks</small>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Menu Load Error:", e.message);
    }
}

// Cart ထဲသို့ ပစ္စည်းထည့်ခြင်း
function handleAddToCart(item) {
    const existing = currentCart.find(i => i.id === item.id);
    if (existing) {
        existing.qty++;
    } else {
        currentCart.push({ 
            id: item.id, 
            name: item.name, 
            price: Number(item.price), 
            qty: 1 
        });
    }
    renderCart();
}

function renderCart() {
    const cartDiv = document.getElementById('selectedItemsList');
    let total = 0;
    
    cartDiv.innerHTML = currentCart.map((item, index) => {
        total += item.price * item.qty;
        return `
            <div class="cart-item" id="item-${index}">
                <img src="${item.image_url || 'https://via.placeholder.com/50'}" onerror="this.src='https://via.placeholder.com/50'">
                <div class="item-info">
                    <div style="font-weight:bold; font-size:13px;">${item.name}</div>
                    <div style="color:#888; font-size:12px;">${item.price.toLocaleString()} Ks</div>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                    <input type="number" class="qty-input" value="${item.qty}" onchange="directInputQty(${index}, this.value)">
                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
                <button onclick="removeFromCart(${index})" style="margin-left:10px; border:none; background:none; color:red;">🗑️</button>
            </div>
        `;
    }).join('');
    document.getElementById('orderTotalAmount').innerText = total.toLocaleString() + " Ks";
}

function updateQty(index, change) {
    currentCart[index].qty += change;
    if (currentCart[index].qty < 1) return removeFromCart(index);
    renderCart();
}

function directInputQty(index, value) {
    const newVal = parseInt(value);
    if (newVal > 0) {
        currentCart[index].qty = newVal;
        renderCart();
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}


function removeFromCart(index) {
    currentCart.splice(index, 1);
    renderCart();
}

// အော်ဒါသိမ်းဆည်းခြင်း
async function submitOrder() {
    const phone = document.getElementById('cPhone').value;
    const name = document.getElementById('cName').value;
    const pTime = document.getElementById('pickupTime').value;
    const pMethod = document.getElementById('payMethod').value;
    const pStatus = document.getElementById('payStatus').value;
    
    if (!phone || !pTime || currentCart.length === 0) return alert("အချက်အလက် ပြည့်စုံအောင်ဖြည့်ပါ!");

    const total = currentCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    try {
        // Customer Profile Update
        await window.sb.from('customers').upsert([
            { phone_number: phone, full_name: name }
        ], { onConflict: 'phone_number' });

        // Order Insert
        const { error } = await window.sb.from('orders').insert([{
            customer_phone: phone,
            customer_name: name,
            items: currentCart,
            total_amount: total,
            pickup_time: pTime,
            payment_method: pMethod,
            payment_status: pStatus,
            order_status: 'Preparing'
        }]);

        if (error) throw error;
        alert("ဘောက်ချာ ထုတ်ပြီးပါပြီ!");
        document.getElementById('orderModal').style.display = 'none';
        loadOrders(); // စာရင်းပြန်ဖွင့်မည်
    } catch (e) { 
        alert("Order Submit Error: " + e.message); 
    }
}

