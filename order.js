let currentCart = [];
let allMenuItems = [];

// ၁။ အော်ဒါဖွင့်လိုက်ရင် Menu ဆွဲတင်ခြင်း
async function openOrderModal() {
    const modal = document.getElementById('orderModal');
    const container = document.getElementById('posContainer');
    modal.style.display = 'flex';
    if (container) container.classList.remove('closing');
    
    currentCart = []; 
    updateCartUI();
    
    try {
        const { data, error } = await window.sb.from('menu').select('*').order('name');
        if (!error) {
            allMenuItems = data;
            renderPOSMenu(data);
            renderCategories(data);
        }
    } catch (e) {
        console.error("Error opening modal:", e.message);
    }
}

// ၂။ Menu များကို POS Grid ထဲပြသခြင်း
function renderPOSMenu(items) {
    const grid = document.getElementById('posMenuGrid');
    if (!grid) return;
    grid.innerHTML = items.map(item => `
        <div class="menu-card" onclick='addToCart(${JSON.stringify(item)})'>
            <img src="${item.image_url || 'https://via.placeholder.com/150'}">
            <div style="padding: 10px;">
                <h4>${item.name}</h4>
                <span style="color: var(--primary); font-weight: 800;">${Number(item.price).toLocaleString()} Ks</span>
                <div style="font-size: 10px; color: #666; margin-top: 5px;">📦 Stock: ${item.stock || 0}</div>
                ${(item.stock || 0) < 1 ? '<div style="color:red; font-size:10px; font-weight:bold;">Out of Stock</div>' : ''}
            </div>
        </div>
    `).join('');
}

// ၃။ Category Tags များ ထုတ်ပေးခြင်း
function renderCategories(items) {
    const cats = ['All', ...new Set(items.map(i => i.category))];
    const catDiv = document.getElementById('posCategories');
    if (!catDiv) return;
    catDiv.innerHTML = cats.map(c => `
        <div class="tag ${c==='All'?'active':''}" onclick="filterByCategory('${c}', this)">${c}</div>
    `).join('');
}

function filterByCategory(cat, el) {
    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const filtered = cat === 'All' ? allMenuItems : allMenuItems.filter(i => i.category === cat);
    renderPOSMenu(filtered);
}

// ၄။ Search လုပ်ခြင်း
function filterPOSMenu() {
    const term = document.getElementById('posSearch').value.toLowerCase();
    const filtered = allMenuItems.filter(i => i.name.toLowerCase().includes(term));
    renderPOSMenu(filtered);
}

// ၅။ Cart ထဲထည့်ခြင်း
function addToCart(item) {
    if ((item.stock || 0) < 1) return alert("လက်ကျန်မရှိတော့ပါ!");
    
    const found = currentCart.find(i => i.id === item.id);
    if (found) {
        found.qty += 1;
    } else {
        currentCart.push({ ...item, qty: 1 });
    }
    updateCartUI();
    renderCartList();
}

function updateCartUI() {
    const count = currentCart.reduce((s, i) => s + i.qty, 0);
    const total = currentCart.reduce((s, i) => s + (i.qty * i.price), 0);
    
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');
    
    if (countEl) countEl.innerText = count;
    if (totalEl) totalEl.innerText = total.toLocaleString() + " Ks";
}

// ၆။ Checkout သွားရန် Modal ဖွင့်ခြင်း
function openCheckoutDetails() {
    if (currentCart.length === 0) return alert("ပစ္စည်း အရင်ရွေးပါ!");
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.style.display = 'flex';
        renderCartList();
    }
}

// ၇။ Checkout ထဲမှာ Cart List ကို ပြသခြင်း
function renderCartList() {
    const list = document.getElementById('selectedItemsList');
    if (!list) return;
    
    list.innerHTML = currentCart.map((item, index) => `
        <div class="premium-cart-item">
            <div style="flex: 1;">
                <div style="font-weight: 800; color: #1F2937;">${item.name}</div>
                <div style="font-size: 13px; color: var(--primary); font-weight: 700;">${(item.price * item.qty).toLocaleString()} Ks</div>
            </div>
            
            <div class="qty-control-premium">
                <button class="qty-btn-new" onclick="updateQty(${index}, -1)">-</button>
                <input type="number" class="qty-input-new" value="${item.qty}" 
                       onchange="directQtyInput(${index}, this.value)">
                <button class="qty-btn-new" onclick="updateQty(${index}, 1)">+</button>
            </div>
            
            <button class="delete-bin-btn" onclick="removeFromCart(${index})">🗑️</button>
        </div>
    `).join('');
}

// လက်နဲ့ Quantity ရိုက်ထည့်ရင် စစ်ဆေးခြင်း
function directQtyInput(index, val) {
    let newQty = parseInt(val);
    if (isNaN(newQty) || newQty < 1) {
        newQty = 1;
    }
    currentCart[index].qty = newQty;
    updateCartUI();
    renderCartList();
}

function updateQty(index, change) {
    currentCart[index].qty += change;
    if (currentCart[index].qty < 1) return removeFromCart(index);
    updateCartUI();
    renderCartList();
}

function removeFromCart(index) {
    if(confirm("ဒီပစ္စည်းကို ဖျက်မှာ သေချာပါသလား?")) {
        currentCart.splice(index, 1);
        updateCartUI();
        renderCartList();
    }
}

// ၈။ Final Order တင်ခြင်း
async function submitFinalOrder() {
    const name = document.getElementById('cName').value || 'ဧည့်သည်';
    const phone = document.getElementById('cPhone').value;
    const status = document.getElementById('payStatus').value;

    if (!phone) return alert("ဖုန်းနံပါတ် ထည့်ပေးပါ!");

    const total = currentCart.reduce((s, i) => s + (i.qty * i.price), 0);

    try {
        const { error: orderError } = await window.sb.from('orders').insert([{
            customer_name: name,
            customer_phone: phone,
            items: currentCart,
            total_amount: total,
            payment_status: status,
            order_status: 'Preparing'
        }]);

        if (orderError) throw orderError;

        // Stock Update
        for (const item of currentCart) {
            const { data: menuData } = await window.sb.from('menu').select('stock').eq('id', item.id).single();
            const newStock = (menuData.stock || 0) - item.qty;
            await window.sb.from('menu').update({ stock: newStock }).eq('id', item.id);
        }

        alert("အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်!");
        location.reload(); 

    } catch (e) {
        alert("Error: " + e.message);
    }
}

function closeOrderModal() {
    const container = document.getElementById('posContainer');
    if (container) container.classList.add('closing');
    setTimeout(() => {
        document.getElementById('orderModal').style.display = 'none';
        if (container) container.classList.remove('closing');
    }, 400);
}

// ၉။ အော်ဒါစာရင်း Load လုပ်ခြင်း
async function loadOrders() {
    try {
        const { data, error } = await window.sb
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        const orderListDiv = document.getElementById('order-list');
        if (!orderListDiv) return;

        if (data.length === 0) {
            orderListDiv.innerHTML = `<p style="text-align:center; padding:50px;">အော်ဒါစာရင်း မရှိသေးပါ။</p>`;
            return;
        }
        renderOrders(data);
    } catch (e) {
        console.error("Order Load Error:", e.message);
    }
}

// ၂။ အော်ဒါများကို UI မှာပြသခြင်း
function renderOrders(orders) {
    const listDiv = document.getElementById('order-list');
    if (!listDiv) return;

    listDiv.innerHTML = orders.map(order => {
        const itemsList = order.items.map(i => `${i.name} x${i.qty}`).join(', ');
        
        // Status အလိုက် CSS Class သတ်မှတ်ခြင်း
        const statusClass = `status-${order.order_status.toLowerCase()}`;
        
        return `
            <div class="order-card-new">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <h4 style="margin:0; font-size:17px;">${order.customer_name}</h4>
                        <div class="info-row">📞 ${order.customer_phone}</div>
                        <div class="info-row">⏰ Pick-up: <b>${order.pickup_time || 'Soon'}</b></div>
                    </div>
                    <span class="badge-status ${statusClass}">${order.order_status}</span>
                </div>

                <div style="margin: 15px 0; background: #f8fafc; padding: 12px; border-radius: 15px;">
                    <small style="color:#94a3b8; display:block; margin-bottom:5px;">ORDER ITEMS</small>
                    <div style="font-size:14px; font-weight:600; color:#334155;">${itemsList}</div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <small style="color:#94a3b8;">Total Amount</small>
                        <div style="font-weight:900; color:var(--primary); font-size:18px;">
                            ${Number(order.total_amount).toLocaleString()} Ks
                        </div>
                        <small style="color:${order.payment_status === 'Paid' ? '#16a34a' : '#ef4444'}; font-weight:700;">
                            ● ${order.payment_status}
                        </small>
                    </div>
                </div>

                <div class="status-toggle-box">
                    <button class="btn-status-step ${order.order_status === 'Preparing' ? 'active' : ''}" 
                        onclick="updateOrderStatus(${order.id}, 'Preparing')">ကင်နေဆဲ</button>
                    <button class="btn-status-step ${order.order_status === 'Ready' ? 'active' : ''}" 
                        onclick="updateOrderStatus(${order.id}, 'Ready')">အဆင်သင့်</button>
                    <button class="btn-status-step ${order.order_status === 'Collected' ? 'active' : ''}" 
                        onclick="updateOrderStatus(${order.id}, 'Collected')">ယူသွားပြီ</button>
                </div>
            </div>
        `;
    }).join('');
}

// ၃။ Status Update လုပ်ခြင်း (Database ထဲထိ ပြောင်းသွားမည်)
async function updateOrderStatus(orderId, newStatus) {
    try {
        const { error } = await window.sb
            .from('orders')
            .update({ order_status: newStatus })
            .eq('id', orderId);

        if (error) throw error;
        
        // Blueprint Phase 4: Ready ဖြစ်ရင် Noti ပြချင်ရင် ဒီမှာ logic ထည့်လို့ရပါတယ်
        if(newStatus === 'Ready') {
            console.log("Notifying Customer: Order is Ready!");
        }

        loadOrders(); // UI ကို refresh ပြန်လုပ်
    } catch (e) {
        alert("Status Update Error: " + e.message);
    }
}


function renderOrders(orders) {
    const orderListDiv = document.getElementById('order-list');
    orderListDiv.innerHTML = orders.map(order => {
        const itemsSummary = order.items.map(i => `${i.name} x ${i.qty}`).join(', ');
        const statusColor = order.payment_status === 'Paid' ? '#2ecc71' : '#e74c3c';

        return `
            <div class="order-card-premium">
                <div class="order-card-header">
                    <div>
                        <h4 style="margin:0;">${order.customer_name}</h4>
                        <small>📞 ${order.customer_phone}</small>
                    </div>
                    <div class="status-badge" style="background:${statusColor}15; color:${statusColor};">
                        ${order.payment_status}
                    </div>
                </div>
                <p style="font-size:13px; margin:10px 0;">📦 ${itemsSummary}</p>
                <div class="order-card-footer">
                    <div>
                        <small>Total</small>
                        <div style="font-weight:800; color:var(--primary);">${Number(order.total_amount).toLocaleString()} Ks</div>
                    </div>
                    <button class="btn-detail-view" onclick="alert('Order ID: ${order.id}')">ကြည့်ရန်</button>
                </div>
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', loadOrders);

