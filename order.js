// Dashboard Statistics Loader
async function loadDashboardStats() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // ၁။ Today's Revenue & Orders
        const { data: orders, error: oErr } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', today);

        if (oErr) throw oErr;

        const stats = {
            total: orders.length,
            revenue: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
            pending: orders.filter(o => o.order_status === 'Preparing').length,
            unpaid: orders.filter(o => o.payment_status === 'Unpaid').reduce((sum, o) => sum + Number(o.total_amount), 0)
        };

        // ၂။ Profit Calculation (Linking order_items with menu cost_price)
        const { data: items } = await supabase
            .from('order_items')
            .select('quantity, unit_price, menu(cost_price)')
            .gte('created_at', today);
        
        const totalProfit = items ? items.reduce((sum, item) => {
            const cost = item.menu?.cost_price || 0;
            return sum + ((item.unit_price - cost) * item.quantity);
        }, 0) : 0;

        // UI Update
        updateDashboardUI(stats, totalProfit);
    } catch (err) {
        console.error("Dashboard Error:", err.message);
    }
}

function updateDashboardUI(stats, profit) {
    document.getElementById('stat-orders').innerText = stats.total;
    document.getElementById('stat-revenue').innerText = stats.revenue.toLocaleString() + " K";
    document.getElementById('stat-profit').innerText = profit.toLocaleString() + " K";
    document.getElementById('stat-pending-count').innerText = stats.pending + " Pending";
}

// Supabase Real-time Channel
const orderChannel = supabase
    .channel('professional-orders')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        playNotificationSound();
        loadDashboardStats();
        if (typeof fetchOrders === 'function') fetchOrders();
    })
    .subscribe();



async function saveNewOrder(customerData, cart) {
    try {
        // Step 1: Insert into Orders Table
        const { data: order, error: oErr } = await supabase
            .from('orders')
            .insert([{
                customer_phone: customerData.phone,
                customer_name: customerData.name,
                total_amount: customerData.total,
                payment_method: customerData.method,
                order_status: 'Preparing'
            }])
            .select().single();

        if (oErr) throw oErr;

        // Step 2: Insert into Order Items (This triggers auto-stock reduction)
        const items = cart.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.qty,
            unit_price: item.price
        }));

        const { error: iErr } = await supabase.from('order_items').insert(items);
        if (iErr) throw iErr;

        // Step 3: Loyalty Point System
        await handleLoyaltyPoints(customerData.phone, customerData.total, customerData.name);

        alert("Order Placed Successfully! Stock Updated.");
        return true;
    } catch (error) {
        alert("Error: " + error.message);
        return false;
    }
}

async function handleLoyaltyPoints(phone, amount, name) {
    const pointsToAdd = Math.floor(amount / 1000); // 1000 MMK = 1 Point

    const { data: customer } = await supabase
        .from('customers')
        .select('total_points, lifetime_value')
        .eq('phone_number', phone)
        .single();

    if (customer) {
        await supabase.from('customers').update({
            total_points: customer.total_points + pointsToAdd,
            lifetime_value: Number(customer.lifetime_value) + Number(amount),
            last_order_date: new Date()
        }).eq('phone_number', phone);
    } else {
        await supabase.from('customers').insert([{
            phone_number: phone,
            full_name: name,
            total_points: pointsToAdd,
            lifetime_value: amount
        }]);
    }
}


function renderOrderCard(order) {
    const statusMap = {
        'Preparing': { color: '#f1c40f', label: 'Prep' },
        'Ready': { color: '#2ecc71', label: 'Ready' },
        'Collected': { color: '#3498db', label: 'Done' }
    };
    
    const config = statusMap[order.order_status] || { color: '#95a5a6' };

    return `
    <div class="order-card professional" style="border-left: 5px solid ${config.color}">
        <div class="card-header">
            <span class="order-id">#${order.id}</span>
            <span class="time">${new Date(order.created_at).toLocaleTimeString()}</span>
        </div>
        <div class="card-body">
            <h4>${order.customer_name} (${order.customer_phone})</h4>
            <div class="status-badge" style="background: ${config.color}">${order.order_status}</div>
        </div>
        <div class="card-footer">
            <div class="total">Total: <strong>${order.total_amount.toLocaleString()} K</strong></div>
            <div class="actions">
                <button onclick="updateOrderStatus(${order.id}, 'Ready')" class="btn-ready">Ready</button>
                <button onclick="finalizeOrder(${order.id}, ${order.total_amount}, '${order.customer_phone}')" class="btn-collect">Complete</button>
            </div>
        </div>
    </div>`;
}

