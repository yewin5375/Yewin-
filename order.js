// orders.js (Update လုပ်ထားသော loadOrders function)

async function loadOrders() {
    const listDiv = document.getElementById('order-list');
    listDiv.innerHTML = '<p>Loading...</p>';

    try {
        const { data, error } = await window.sb
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        listDiv.innerHTML = data.map(order => `
            <div class="order-card" style="background: white; margin-bottom: 12px; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 5px solid ${order.status === 'completed' ? '#28a745' : '#ffc107'};">
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: bold;">#${order.id} - ${order.customer_name}</span>
                    <span style="color: #28a745; font-weight: bold;">${Number(order.total_amount).toLocaleString()} Ks</span>
                </div>
                <div style="margin: 10px 0; font-size: 13px; color: #666;">
                    Status: <b>${order.status || 'pending'}</b>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button onclick="updateOrderStatus(${order.id}, 'completed')" style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Done</button>
                    <button onclick="deleteOrder(${order.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        listDiv.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
    }
}

// Status ပြောင်းရန် Function
async function updateOrderStatus(orderId, newStatus) {
    const { error } = await window.sb
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) {
        alert("Status ပြောင်းရာတွင် အမှားရှိသည်: " + error.message);
    } else {
        loadOrders(); // စာရင်းပြန်တင်မယ်
    }
}

// Order ဖျက်ရန် Function
async function deleteOrder(orderId) {
    if (confirm("ဒီအော်ဒါကို ဖျက်မှာ သေချာလား?")) {
        const { error } = await window.sb
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) {
            alert("ဖျက်ရာတွင် အမှားရှိသည်: " + error.message);
        } else {
            loadOrders(); // စာရင်းပြန်တင်မယ်
            if (typeof loadDashboard === 'function') loadDashboard(); // Dashboard က အရေအတွက်ပါ လျှော့မယ်
        }
    }
}

