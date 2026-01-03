async function loadOrders() {
    const listDiv = document.getElementById('order-list');
    if (!listDiv) return;
    listDiv.innerHTML = '<p>Loading...</p>';

    try {
        const { data, error } = await window.sb.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        listDiv.innerHTML = data.map(order => `
            <div class="stat-card" style="text-align:left; margin-bottom:10px; border-left: 5px solid ${order.status === 'completed' ? '#28a745' : '#f39c12'}">
                <div style="display:flex; justify-content:space-between">
                    <b>#${order.id} - ${order.customer_name}</b>
                    <b style="color:#28a745">${Number(order.total_amount).toLocaleString()} Ks</b>
                </div>
                <p style="font-size:12px; margin: 5px 0;">Status: ${order.status || 'pending'}</p>
                <div style="margin-top:10px">
                    <button onclick="updateStatus(${order.id}, 'completed')" style="background:#28a745; color:white; border:none; padding:5px 12px; border-radius:5px; cursor:pointer">Done</button>
                    <button onclick="deleteOrder(${order.id})" style="background:#e74c3c; color:white; border:none; padding:5px 12px; border-radius:5px; margin-left:5px; cursor:pointer">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (e) { 
        listDiv.innerHTML = "Error loading orders."; 
    }
}

async function updateStatus(id, status) {
    await window.sb.from('orders').update({ status: status }).eq('id', id);
    loadOrders();
    loadDashboard();
}

async function deleteOrder(id) {
    if(confirm("အော်ဒါကို ဖျက်မှာ သေချာလား?")) {
        await window.sb.from('orders').delete().eq('id', id);
        loadOrders();
        loadDashboard();
    }
}

