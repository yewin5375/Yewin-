document.addEventListener('DOMContentLoaded', () => {
    fetchAllCustomers();
});

// ၁။ Customer အားလုံးကို ဆွဲထုတ်ပြသခြင်း
async function fetchAllCustomers() {
    const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('last_visit', { ascending: false });

    const grid = document.getElementById('customer-grid');
    grid.innerHTML = customers.map(c => `
        <div class="customer-card glass-card" onclick="viewCustomerDetail('${c.id}')">
            <div class="cust-info">
                <h4>${c.name || 'Unknown'}</h4>
                <p>${c.phone}</p>
            </div>
            <div class="cust-stats">
                <span>${c.total_points || 0} Pts</span>
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `).join('');
}

// ၂။ Customer တစ်ယောက်ချင်းစီ Profile ကြည့်ခြင်း
async function viewCustomerDetail(id) {
    document.getElementById('customer-list-view').classList.add('hidden');
    document.getElementById('customer-detail-view').classList.remove('hidden');

    const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single();
    if (customer) {
        document.getElementById('cust-name').innerText = customer.name;
        document.getElementById('cust-phone').innerText = customer.phone;
        document.getElementById('cust-points').innerText = `${customer.total_points} Points`;
        document.getElementById('cust-total-spent').innerText = `${customer.lifetime_value.toLocaleString()} K`;
        // Order History တွေကိုလည်း ဒီမှာ ဆွဲထုတ်လို့ရပါတယ်
    }
}

function showCustomerList() {
    document.getElementById('customer-list-view').classList.remove('hidden');
    document.getElementById('customer-detail-view').classList.add('hidden');
}

