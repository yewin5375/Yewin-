document.addEventListener('DOMContentLoaded', fetchAllCustomers);

// ၁။ Customer အားလုံးစာရင်းကို ဆွဲထုတ်ခြင်း
async function fetchAllCustomers() {
    const grid = document.getElementById('customer-grid');
    if (!grid) return;

    // Supabase မှ နာမည်အလိုက် စီပြီး ဆွဲထုတ်သည်
    const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching customers:", error);
        return;
    }

    grid.innerHTML = customers.map(c => `
        <div class="customer-card" onclick="viewCustomerDetail('${c.id}')">
            <div class="cust-info">
                <h4 style="margin:0; font-size:15px;">${c.name || 'Unknown User'}</h4>
                <p style="margin:0; font-size:12px; color:var(--text-muted);">${c.phone || 'No Phone'}</p>
            </div>
            <div class="cust-stats" style="text-align:right;">
                <span class="badge">${c.total_points || 0} Pts</span>
                <i class="fas fa-chevron-right" style="margin-left:10px; color:#ccc; font-size:12px;"></i>
            </div>
        </div>
    `).join('');
}

// ၂။ တစ်ယောက်ချင်းစီ Profile အသေးစိတ်ကြည့်ခြင်း
async function viewCustomerDetail(id) {
    if (!id) return;
    
    // UI အဖွင့်အပိတ်လုပ်ခြင်း
    document.getElementById('customer-list-view').classList.add('hidden');
    document.getElementById('customer-detail-view').classList.remove('hidden');

    // Customer အချက်အလက်ကို id ဖြင့် ရှာသည်
    const { data: c, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return console.error(error);

    if (c) {
        document.getElementById('cust-name').innerText = c.name || 'No Name';
        document.getElementById('cust-phone').innerText = c.phone || 'No Phone';
        document.getElementById('cust-points').innerText = `${c.total_points || 0} Points`;
        
        // Lifetime Value ပြသခြင်း (toLocaleString ဖြင့် ငွေပမာဏ ကော်မာ ခံသည်)
        const spent = c.lifetime_value || 0;
        document.getElementById('cust-total-spent').innerText = `${spent.toLocaleString()} MMK`;
        
        // သူ့ရဲ့ အရင်အော်ဒါဟောင်းများကို ပြခြင်း
        fetchCustomerOrders(id);
    }
}

// ၃။ Customer ၏ အော်ဒါမှတ်တမ်းများကို ဆွဲထုတ်ခြင်း
async function fetchCustomerOrders(customerId) {
    const container = document.getElementById('customer-order-history');
    if (!container) return;

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    if (error || !orders) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">No order history found.</p>';
        return;
    }

    container.innerHTML = `<h4 style="margin:20px; font-size:14px;">Order History</h4>` + 
    orders.map(o => `
        <div class="history-item">
            <div style="display:flex; flex-direction:column;">
                <span style="font-size:12px; color:var(--text-muted);">${new Date(o.created_at).toLocaleDateString()}</span>
                <span style="font-size:10px; color:var(--primary-accent);">${o.order_status}</span>
            </div>
            <strong style="font-size:14px;">${o.total_amount.toLocaleString()} K</strong>
        </div>
    `).join('');
}

// ၄။ List မြင်ကွင်းသို့ ပြန်သွားခြင်း
function showCustomerList() {
    document.getElementById('customer-list-view').classList.remove('hidden');
    document.getElementById('customer-detail-view').classList.add('hidden');
}

// ၅။ နာမည် သို့မဟုတ် ဖုန်းဖြင့် ရှာဖွေခြင်း
function filterCustomers() {
    const val = document.getElementById('customer-search').value.toLowerCase();
    const cards = document.querySelectorAll('.customer-card');
    
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(val) ? 'flex' : 'none';
    });
}
