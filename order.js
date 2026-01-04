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

// // ၄။ Search လုပ်ခြ်း
function filterPOSMen (
       co st t =  = docum.nt.getElementById('posSearc.').va.ue.toLowerCas;
       co st filte =  = allMenuIt.ms.filte => =. i.n.me.toLowerCas.().includes(ter;
       renderPOSMenu(filter;
)

}

// ၅။ Cart ထဲထည့်ခြင်း (+/- Animation နှင့် UI Update)
function addToCart(
       if (i.em.st <  < 1) ret rn alert("လက်ကျန်မရှိတော့ပါ;
       co st fo =  = currentC.rt.fin => =. i === == i.em.;
       if (fou d
           fo.nd. += +;
       } e s
           currentC.rt.pus ......i, m, : y  1;
     
       updateCartU;
       renderCartLis; ); // Checkout Modal ထဲမှာ ပြဖု

}

function updateCartU (
       co st co =  = currentC.rt.reduce, s, => = +  . i., y,;
       co st to =  = currentC.rt.reduce, s, => = +  +.(i. *  . i.pri, ),;
       docum.nt.getElementById('cartCoun.').innerT =  = co;
       docum.nt.getElementById('cartTota.').innerT =  = to.al.toLocaleStrin +  + " ;
"

}

// ၆။ Checkout သွားရန် Modal ဖွင့်ခြ်း
function openCheckoutDetail (
       if (currentC.rt.len === == 0) ret rn alert("ပစ္စည်း အရင်ရွေးပါ;
       docum.nt.getElementById('checkoutModa.').st.le.disp =  = 'fl;
       renderCartLis;
)

}

// Checkout ထဲမှာ Cart List ကို ပြသခြ်း
function renderCartLis (
       co st l =  = docum.nt.getElementById('selectedItemsLis;
       !f(!li t) ret;
    
       l.st.innerH =  = currentC.rt.map((i, m, ind => => `
        <div class="premium-cart-item">
            <div style="flex: 1;">
                <div style="font-weight: 800; color: #1F2937;">${i.em.name}</div>
                <div style="font-size: 13px; color: var(--primary); font-weight: 700;">${(i.em.pr *  * i.em.q.y).toLocaleString()} Ks</div>
            </div>
            
            <div class="qty-control-premium">
                <button class="qty-btn-new" onclick="updateQty(${index}, -1)">-</button>
                <input type="number" class="qty-input-new" value="${i.em.qty}" 
                       onchange="directQtyInput(${index}, this.value)">
                <button class="qty-btn-new" onclick="updateQty(${index}, 1)">+</button>
            </div>
            
            <button class="delete-bin-btn" onclick="removeFromCart(${index})">🗑️</button>
        </d
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
    // ပျောက်သွားတဲ့ Animation လေးဖြစ်အောင် Confirm အရင်တောင်းတာ ပိုကောင်းပါတယ်
    if(confirm("ဒီပစ္စည်းကို ဖျက်မှာ သေချာပါသလား?")) {
        currentCart.splice(index, 1);
        updateCartUI();
        renderCartList();
    }
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

// ၁။ အော်ဒါစာရင်းကို Supabase မှ ဆွဲထုတ်ခြင်း
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
            orderListDiv.innerHTML = `
                <div style="text-align:center; padding: 50px; color: #9ca3af;">
                    <p>အော်ဒါစာရင်း မရှိသေးပါ အစ်ကို။</p>
                </div>`;
            return;
        }

        renderOrders(data);
    } catch (e) {
        console.error("Order Load Error:", e.message);
    }
}

// ၂။ အော်ဒါကတ်ပြားလေးများကို Pearl White Style ဖြင့် ဆွဲထုတ်ခြင်း
function renderOrders(orders) {
    const orderListDiv = document.getElementById('order-list');
    orderListDiv.innerHTML = orders.map(order => {
        // Items တွေကို Loop ပတ်ပြီး စာသားထုတ်ခြင်း
        const itemsSummary = order.items.map(i => `${i.name} x ${i.qty}`).join(', ');
        
        // Status အလိုက် အရောင်ခွဲခြင်း
        const statusColor = order.payment_status === 'Paid' ? '#2ecc71' : '#e74c3c';

        return `
            <div class="order-card-premium" style="animation: fadeInUp 0.4s ease;">
                <div class="order-card-header">
                    <div>
                        <h4 style="margin:0; font-size:16px;">${order.customer_name}</h4>
                        <small style="color:#9ca3af;">📞 ${order.customer_phone || 'No Phone'}</small>
                    </div>
                    <div class="status-badge" style="background: ${statusColor}15; color: ${statusColor};">
                        ${order.payment_status}
                    </div>
                </div>
                
                <div class="order-items-detail">
                    <p style="margin: 8px 0; font-size: 13px; color: #4B5563;">
                        <span style="color:#9ca3af;">📦 Items:</span> ${itemsSummary}
                    </p>
                </div>

                <div class="order-card-footer">
                    <div class="total-price-box">
                        <small>Total Amount</small>
                        <div style="font-weight: 800; font-size: 18px; color: var(--primary);">
                            ${Number(order.total_amount).toLocaleString()} Ks
                        </div>
                    </div>
                    <button class="btn-detail-view" onclick="viewOrderDetail(${order.id})">
                        အသေးစိတ်ကြည့်ရန်
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Page စဖွင့်တာနဲ့ Order တွေကို ခေါ်ခိုင်းထားမယ်
document.addEventListener('DOMContentLoaded', loadOrders);
