async function fetchCustomers() {
    const grid = document.getElementById('customer-grid');
    if (!grid) return;

    const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('total_spend', { ascending: false });

    if (error) return;

    grid.innerHTML = customers.map(c => `
        <div class="customer-card glass-card">
            <div class="cust-header">
                <i class="fas fa-user-circle"></i>
                <div>
                    <strong>${c.full_name || 'Customer'}</strong>
                    <p>${c.phone_number}</p>
                </div>
            </div>
            <div class="cust-stats">
                <div class="stat">
                    <span>Points</span>
                    <strong class="points-val">${c.points || 0}</strong>
                </div>
                <div class="stat">
                    <span>Total Spend</span>
                    <strong>${Number(c.total_spend || 0).toLocaleString()} K</strong>
                </div>
            </div>
        </div>
    `).join('');
}
