async sync fun tion loadCustom r
    
     o st {, ata,  r =  } =  wait w.nd.w.sb.from('custom.rs').select.'*').order('total_s, n ', { asce: ing:  al;
    
     onst li = iv = doc.ment.getElementById('customer-l;
    
   !if (!e r
             li.tDiv.inne = ML =.data. => c => `
            <div class="stat-card" style="text-align:left;">
                <b>�. ${c || e || 'Unknown'}.(${c.phone})</b>
                <p>Total Spent: ${Num.er(c.total_s.ent).toLocaleString()} Ks</p>
                <p>Points. ${c.points} pts | Orders. ${c.total_orders}</p>
            </div>
     .  `).joi;
    

 
// customer.js ထဲမှာ loadCustomers ကို ဒီလိုပြင်ပါ
async function loadCustomers(search = '') {
    let query = window.sb.from('customers').select('*').order('total_spent', { ascending: false });
    
    if (search) {
        query = query.ilike('phone', `%${search}%`);
    }

    const { data, error } = await query;
    const listDiv = document.getElementById('customer-list');
    
    listDiv.innerHTML = `
        <input type="text" placeholder="Search by Phone..." oninput="loadCustomers(this.value)" 
               style="width:100%; padding:10px; margin-bottom:20px; border-radius:5px; border:1px solid #ccc;">
        <div class="grid-container">
            ${data.map(c => `
                <div class="stat-card">
                    <h3 style="margin:0; color:#e67e22;">${c.name || 'VIP Customer'}</h3>
                    <p>📱 ${c.phone}</p>
                    <hr>
                    <p>💰 Spent: <b>${Number(c.total_spent).toLocaleString()} Ks</b></p>
                    <p>⭐ Points: <b>${c.points}</b></p>
                    <p>📦 Orders: <b>${c.total_orders}</b></p>
                </div>
            `).join('')}
        </div>
    `;
}

