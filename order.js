async function loadOrders() {
    const { data, error } = await window.sb
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    const listDiv = document.getElementById('order-list');
    if (error) return console.error(error);

    listDiv.innerHTML = data.map(order => `
        <div class="stat-card" style="text-align:left; border-left: 5px solid ${getStatusColor(order.status)}">
            <div style="display:flex; justify-content:space-between;">
                <b>🆔 Order #${order.id}</b>
                <span class="badge" style="background:${order.payment_status === 'paid' ? '#28a745' : '#dc3545'}">
                    ${order.payment_status.toUpperCase()} (${order.payment_method})
                </span>
            </div>
            <p>👤 <b>${order.customer_name}</b> (${order.customer_phone})</p>
            <p>⏰ Pick-up: <b>${order.pickup_time}</b></p>
            <p>💰 Total: <b>${order.total_amount} Ks</b></p>
            <hr>
            <div class="action-btns">
                <select onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready for Pick-up</option>
                    <option value="collected" ${order.status === 'collected' ? 'selected' : ''}>Collected (Done)</option>
                </select>
                <button onclick="markAsPaid(${order.id})" ${order.payment_status === 'paid' ? 'disabled' : ''}>
                    ${order.payment_status === 'paid' ? 'Paid' : 'Mark as Paid'}
                </button>
            </div>
        </div>
    `).join('');
}

function getStatusColor(status) {
    const colors = { pending: '#ffc107', preparing: '#17a2b8', ready: '#28a745', collected: '#6c757d' };
    return colors[status] || '#eee';
}

async function updateOrderStatus(id, status) {
    await window.sb.from('orders').update({ status: status }).eq('id', id);
    loadOrders();
}

async function markAsPaid(id) {
    if(confirm("Confirm payment received?")) {
        await window.sb.from('orders').update({ payment_status: 'paid' }).eq('id', id);
        loadOrders();
    }
}


