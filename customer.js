async function loadCustomers() {
    const { data, error } = await window.sb.from('customers').select('*').order('total_spent', { ascending: false });
    const listDiv = document.getElementById('customer-list');
    if (!error) {
        listDiv.innerHTML = data.map(c => `
            <div class="stat-card" style="text-align:left;">
                <b>👤 ${c.name || 'Unknown'} (${c.phone})</b>
                <p>Total Spent: ${Number(c.total_spent).toLocaleString()} Ks</p>
                <p>Points: ${c.points} pts | Orders: ${c.total_orders}</p>
            </div>
        `).join('');
    }
}
