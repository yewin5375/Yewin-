async function loadCustomers(search = '') {
    try {
        let query = window.sb.from('customers').select('*').order('total_spent', { ascending: false });
        
        if (search) {
            query = query.ilike('phone', `%${search}%`);
        }

        const { data, error } = await query;
        const listDiv = document.getElementById('customer-list');
        if (error) throw error;

        listDiv.innerHTML = `
            <div style="margin-bottom:20px;">
                <input type="text" placeholder="ဖုန်းနံပါတ်ဖြင့် ရှာရန်..." 
                       oninput="loadCustomers(this.value)" 
                       style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd; font-size:16px;">
            </div>
            <div class="grid-container">
                ${data.map(c => `
                    <div class="stat-card" style="border-top: 4px solid #e67e22;">
                        <h3 style="margin:0 0 10px 0;">${c.name || 'VIP Customer'}</h3>
                        <p>📱 <b>${c.phone}</b></p>
                        <hr style="opacity:0.2;">
                        <p>💰 Spent: <b>${Number(c.total_spent).toLocaleString()} Ks</b></p>
                        <p>⭐ Points: <b>${c.points} pts</b></p>
                        <p>📦 Total Orders: <b>${c.total_orders}</b></p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) {
        console.error("Customer Error:", e.message);
    }
}

