// orders.js

async function loadOrders() {
    const listDiv = document.getElementById('order-list');
    
    // Loading ဖြစ်နေစဉ် ပြသရန်
    listDiv.innerHTML = '<p style="padding: 20px;">အော်ဒါများ ရှာဖွေနေပါသည်...</p>';

    try {
        // window.sb ကို သုံးပြီး database ထဲက orders table ကို လှမ်းခေါ်မယ်
        const { data, error } = await window.sb
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data.length === 0) {
            listDiv.innerHTML = '<p style="padding: 20px;">အော်ဒါစာရင်း မရှိသေးပါ။</p>';
            return;
        }

        // Data တွေကို HTML ပုံစံ ပြောင်းလဲခြင်း
        listDiv.innerHTML = data.map(order => `
            <div class="order-card" style="
                background: white; 
                margin-bottom: 15px; 
                padding: 20px; 
                border-radius: 12px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                border-left: 5px solid ${order.status === 'completed' ? '#28a745' : '#ffc107'};
            ">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem;">#${order.id} - ${order.customer_name}</h3>
                        <p style="margin: 8px 0; color: #555; font-weight: bold;">${Number(order.total_amount).toLocaleString()} Ks</p>
                    </div>
                    <span style="
                        padding: 4px 12px; 
                        border-radius: 20px; 
                        font-size: 12px; 
                        text-transform: uppercase;
                        background: ${order.status === 'completed' ? '#e8f5e9' : '#fff3e0'};
                        color: ${order.status === 'completed' ? '#2e7d32' : '#ef6c00'};
                    ">
                        ${order.status || 'pending'}
                    </span>
                </div>
                <div style="margin-top: 10px; font-size: 0.85rem; color: #888;">
                    📅 ${new Date(order.created_at).toLocaleString()}
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Orders load လုပ်ရာတွင် မှားယွင်းမှုရှိသည်:", err);
        listDiv.innerHTML = `<p style="color: red; padding: 20px;">အော်ဒါများ ခေါ်ယူ၍မရပါ: ${err.message}</p>`;
    }
}
