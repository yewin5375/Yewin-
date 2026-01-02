// orders.js

async function loadOrders() {
    console.log("Attempting to load orders...");
    const listDiv = document.getElementById('order-list');
    
    if (!listDiv) {
        console.error("order-list div ကို ရှာမတွေ့ပါ။ index.html ကို စစ်ပါ။");
        return;
    }

    listDiv.innerHTML = '<p style="padding: 20px;">အော်ဒါများ ရှာဖွေနေပါသည်...</p>';

    try {
        // window.sb ရှိမရှိ အရင်စစ်မယ်
        if (!window.sb) {
            throw new Error("Supabase connection (sb) မရှိသေးပါ။");
        }

        const { data, error } = await window.sb
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log("Orders received:", data);

        if (!data || data.length === 0) {
            listDiv.innerHTML = '<p style="padding: 20px;">အော်ဒါစာရင်း မရှိသေးပါ။</p>';
            return;
        }

        listDiv.innerHTML = data.map(order => `
            <div class="order-card" style="
                background: white; 
                margin-bottom: 12px; 
                padding: 15px; 
                border-radius: 8px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-left: 5px solid ${order.status === 'completed' ? '#28a745' : '#ffc107'};
            ">
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: bold;">#${order.id} - ${order.customer_name}</span>
                    <span style="color: #28a745; font-weight: bold;">${Number(order.total_amount).toLocaleString()} Ks</span>
                </div>
                <div style="margin-top: 5px; font-size: 13px; color: #666;">
                    အခြေအနေ: ${order.status || 'pending'} <br>
                    ${new Date(order.created_at).toLocaleString()}
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Load Orders Error:", err);
        alert("အော်ဒါများ ခေါ်ယူ၍မရပါ- " + err.message);
        listDiv.innerHTML = `<p style="color: red; padding: 20px;">Error: ${err.message}</p>`;
    }
}

