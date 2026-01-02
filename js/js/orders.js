// js/orders.js

async function loadOrders() {
    const listDiv = document.getElementById('order-list');
    listDiv.innerHTML = '<p style="padding:20px;">Loading orders...</p>';

    // Supabase ကနေ data ယူမယ်
    const { data, error } = await sb
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        listDiv.innerHTML = '<p style="color:red; padding:20px;">Error loading orders.</p>';
        return;
    }

    if (data.length === 0) {
        listDiv.innerHTML = '<p style="padding:20px;">No orders found.</p>';
        return;
    }

    // ရလာတဲ့ data ကို list ပုံစံပြမယ်
    listDiv.innerHTML = data.map(order => `
        <div class="order-card" style="background:white; margin:10px; padding:20px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4 style="margin:0;">#${order.id} - ${order.customer_name}</h4>
                <span style="background:#e3f2fd; color:#1976d2; padding:5px 10px; border-radius:15px; font-size:12px;">
                    ${order.status || 'Pending'}
                </span>
            </div>
            <p style="margin:10px 0 0 0; color:#666;">Amount: <strong>${Number(order.total_amount).toLocaleString()} Ks</strong></p>
            <small style="color:#999;">Date: ${new Date(order.created_at).toLocaleString()}</small>
        </div>
    `).join('');
}

