document.addEventListener('DOMContentLoaded', fetchAllCustomers);

// ၁။ Customer အားလုံးစာရင်းကို ဆွဲထုတ်ခြင်း
async function fetchAllCustomers() {
    const grid = document.getElementById('customer-grid');
    if (!grid) return;

    const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

    if (error) return;

    grid.innerHTML = customers.map(c => `
        <div class="customer-card glass-card" onclick="viewCustomerDetail('${c.id}')">
            <div class="cust-info">
                <h4>${c.name || 'No Name'}</h4>
                <p>${c.phone || 'No Phone'}</p>
            </div>
            <div class="cust-stats">
                <span class="badge">${c.total_points || 0} Pts</span>
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `).join('');
}

// ၂။ တစ်ယောက်ချင်းစီ Profile အသေးစိတ်ကြည့်ခြင်း
async function viewCustomerDetail(id) {
    // UI အဖွင့်အပိတ်လုပ်ခြင်း
    document.getElementById('customer-list-view').classList.add('hidden');
    document.getElementById('customer-detail-view').classList.remove('hidden');

    const { data: c } = await supabase.from('customers').select('*').eq('id', id).single();
    if (c) {
        document.getElementById('cust-name').innerText = c.name;
        document.getElementById('cust-phone').innerText = c.phone;
        document.getElementById('cust-points').innerText = `${c.total_points || 0} Points`;
        document.getElementById('cust-total-spent').innerText = `${(c.lifetime_value || 0).toLocaleString()} MMK`;
        
        // သူ့ရဲ့ အရင်အော်ဒါဟောင်းများကို ပြခြင်း
        fetchCustomerOrders(id);
    }
}

async function fetchCustomerOrders(customerId) {
    const { data: orders } = await supabase.from('orders')
        .select('*').eq('customer_id', customerId).order('created_at', {ascending: false});
    
    const container = document.getElementById('customer-order-history');
    container.innerHTML = orders.map(o => `
        <div class="history-item">
            <span>${new Date(o.created_at).toLocaleDateString()}</span>
            <strong>${o.total_amount.toLocaleString()} K</strong>
        </div>
    `).join('');
}

function showCustomerList() {
    document.getElementById('customer-list-view').classList.remove('hidden');
    document.getElementById('customer-detail-view').classList.add('hidden');
}

function filterCustomers() {
    const val = document.getElementById('customer-search').value.toLowerCase();
    const cards = document.querySelectorAll('.customer-card');
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(val) ? 'flex' : 'none';
    });
}

