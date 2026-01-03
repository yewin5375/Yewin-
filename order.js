let currentCart = [];
let allMenuItems = [];

// ၁။ အော်ဒါဖွင့်လိုက်ရင် Menu ဆွဲတင်ခြင်း
async function openOrderModal() {
    const modal = document.getElementById('orderModal');
    const container = document.getElementById('posContainer');
    modal.style.display = 'flex';
    container.classList.remove('closing');
    
    currentCart = []; 
    updateCartUI();
    
    // Database မှ Menu များကို ယူသည်
    const { data, error } = await window.sb.from('menu').select('*').order('name');
    if (!error) {
        allMenuItems = data;
        renderPOSMenu(data);
        renderCategories(data);
    }
}

// ၂။ Menu များကို POS Grid ထဲပြသခြင်း (၂ ခုတွဲပြရန် Grid CSS နှင့် ချိတ်သည်)
function renderPOSMenu(items) {
    const grid = document.getElementById('posMenuGrid');
    grid.innerHTML = items.map(item => `
        <div class="menu-card" onclick='addToCart(${JSON.stringify(item)})'>
            <img src="${item.image_url || 'https://via.placeholder.com/150'}">
            <div style="padding: 10px;">
                <h4>${item.name}</h4>
                <span style="color: var(--primary); font-weight: 800;">${Number(item.price).toLocaleString()} Ks</span>
                <div style="font-size: 10px; color: #666; margin-top: 5px;">📦 Stock: ${item.stock || 0}</div>
                ${item.stock < 1 ? '<div style="color:red; font-size:10px; font-weight:bold;">Out of Stock</div>' : ''}
            </div>
        </div>
    `).join('');
}

// ၃။ Category Tags များ ထုတ်ပေးခြင်း
function renderCategories(items) {
    const cats = ['All', ...new Set(items.map(i => i.category))];
    const catDiv = document.getElementById('posCategories');
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

// ၅။ Cart ထဲထည့်ခြင်း (+/- Animation နှင့် UI Update)
function addToCart(item) {
    if (item.stock < 1) return alert("လက်ကျန်မရှိတော့ပါ!");
    const found = currentCart.find(i => i.id === item.id);
    if (found) {
        found.qty += 1;
    } else {
        currentCart.push({ ...item, qty: 1 });
    }
    updateCartUI();
    renderCartList(); // Checkout Modal ထဲမှာ ပြဖို့
}

function updateCartUI() {
    const count = currentCart.reduce((s, i) => s + i.qty, 0);
    const total = currentCart.reduce((s, i) => s + (i.qty * i.price), 0);
    document.getElementById('cartCount').innerText = count;
    document.getElementById('cartTotal').innerText = total.toLocaleString() + " Ks";
}

// ၆။ Checkout သွားရန် Modal ဖွင့်ခြင်း
function openCheckoutDetails() {
    if (currentCart.length === 0) return alert("ပစ္စည်း အရင်ရွေးပါ!");
    document.getElementById('checkoutModal').style.display = 'flex';
    renderCartList();
}

// ၇။ Checkout ထဲက Cart List (+/- ခလုတ်များ)
function renderCartList() {
    const list = document.getElementById('selectedItemsList');
    if(!list) return; // HTML မှာ ဒီ ID ထည့်ထားဖို့လိုမယ်
    list.innerHTML = currentCart.map((item, index) => `
        <div class="premium-cart-item">
            <div style="flex: 1;">
                <b>${item.name}</b><br>
                <small>${item.price.toLocaleString()} Ks</small>
            </div>
            <div class="qty-control">
                <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                <input type="number" value="${item.qty}" readonly style="width:30px; border:none; text-align:center; background:none;">
                <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
            </div>
            <div class="item-delete-anim" onclick="removeFromCart(${index})">🗑️</div>
        </div>
    `).join('');
}

function updateQty(index, change) {
    currentCart[index].qty += change;
    if (currentCart[index].qty < 1) return removeFromCart(index);
    updateCartUI();
    renderCartList();
}

function removeFromCart(index) {
    currentCart.splice(index, 1);
    updateCartUI();
    renderCartList();
}

// ၈။ Final Order တင်ခြင်း (Confirm Button)
async function submitFinalOrder() {
    const name = document.getElementById('cName').value || 'ဧည့်သည်';
    const phone = document.getElementById('cPhone').value;
    const status = document.getElementById('payStatus').value;

    if (!phone) return alert("ဖုန်းနံပါတ် ထည့်ပေးပါ!");

    const total = currentCart.reduce((s, i) => s + (i.qty * i.price), 0);

    try {
        // Order သိမ်းခြင်း
        const { error: orderError } = await window.sb.from('orders').insert([{
            customer_name: name,
            customer_phone: phone,
            items: currentCart,
            total_amount: total,
            payment_status: status,
            order_status: 'Preparing'
        }]);

        if (orderError) throw orderError;

        // Stock လျှော့ခြင်း
        for (const item of currentCart) {
            const { data: menuData } = await window.sb.from('menu').select('stock').eq('id', item.id).single();
            const newStock = (menuData.stock || 0) - item.qty;
            await window.sb.from('menu').update({ stock: newStock }).eq('id', item.id);
        }

        alert("အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်!");
        location.reload(); // Refresh လုပ်ပြီး အော်ဒါစာရင်းအသစ်ကိုပြသည်

    } catch (e) {
        alert("Error: " + e.message);
    }
}

function closeOrderModal() {
    const container = document.getElementById('posContainer');
    container.classList.add('closing');
    setTimeout(() => {
        document.getElementById('orderModal').style.display = 'none';
        container.classList.remove('closing');
    }, 400);
}

