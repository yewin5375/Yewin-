let currentCart = [];

// === ၁။ POS Modal ဖွင့်ခြင်း ===
function openOrderModal() {
    currentCart = [];
    renderCart();
    
    // အချိန် အော်တိုပေးခြင်း
    const now = new Date();
    now.setMinutes(now.getMinutes() + 20);
    document.getElementById('pickupTime').value = now.toISOString().slice(0, 16);
    
    document.getElementById('orderModal').style.display = 'flex';
    loadMenuToOrder(); 
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// === ၂။ Menu များ ဆွဲထုတ်ခြင်း ===
async function loadMenuToOrder() {
    const menuGrid = document.getElementById('itemSelectionGrid');
    try {
        const { data, error } = await window.sb.from('menu').select('*');
        if (error) throw error;

        menuGrid.innerHTML = data.map(item => `
            <div class="menu-item-card" onclick='handleAddToCart(${JSON.stringify(item)})'>
                <img src="${item.image_url || 'https://via.placeholder.com/150'}" onerror="this.src='https://via.placeholder.com/150'">
                <h4 style="margin: 12px 0 5px;">${item.name}</h4>
                <span style="color: var(--accent-soft); font-weight: 800;">${Number(item.price).toLocaleString()} Ks</span>
            </div>
        `).join('');
    } catch (e) { console.error(e.message); }
}

// === ၃။ Cart စနစ် (+/- နှင့် Swipe Delete) ===
function handleAddToCart(item) {
    const existing = currentCart.find(i => i.id === item.id);
    if (existing) {
        existing.qty++;
    } else {
        currentCart.push({ ...item, qty: 1 });
    }
    renderCart();
}

function renderCart() {
    const cartDiv = document.getElementById('selectedItemsList');
    let total = 0;
    
    cartDiv.innerHTML = currentCart.map((item, index) => {
        total += item.price * item.qty;
        return `
            <div class="premium-cart-item">
                <div style="flex: 1;">
                    <div style="font-weight: 800; font-size: 14px;">${item.name}</div>
                    <div style="font-size: 12px; color: #888;">${item.price.toLocaleString()} Ks</div>
                </div>
                <div class="qty-pill">
                    <button onclick="updateQty(${index}, -1)">-</button>
                    <input type="number" value="${item.qty}" readonly>
                    <button onclick="updateQty(${index}, 1)">+</button>
                </div>
                <button onclick="removeFromCart(${index})" style="margin-left:15px; border:none; background:none; color:#ff4d4d; font-size:18px;">🗑️</button>
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

function removeFromCart(index) {
    currentCart.splice(index, 1);
    renderCart();
}

// === ၄။ အော်ဒါသိမ်းဆည်းခြင်း (Submit) ===
async function submitOrder() {
    const phone = document.getElementById('cPhone').value;
    const name = document.getElementById('cName').value || 'ဧည့်သည်';
    
    if (!phone || currentCart.length === 0) return alert("ဖုန်းနံပါတ်နှင့် ပစ္စည်းရွေးပေးပါ!");

    const total = currentCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    try {
        const { error } = await window.sb.from('orders').insert([{
            customer_phone: phone,
            customer_name: name,
            items: currentCart,
            total_amount: total,
            pickup_time: document.getElementById('pickupTime').value,
            payment_status: document.getElementById('payStatus').value,
            order_status: 'Preparing'
        }]);

        if (error) throw error;
        alert("အော်ဒါ အောင်မြင်ပါသည်။");
        closeOrderModal();
        loadOrders(); // Main list ကို update လုပ်မယ်
    } catch (e) {
        alert("Error: " + e.message);
    }
}

