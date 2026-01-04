// ၁။ Customer Insight ဒေတာများကို ဆွဲထုတ်ခြင်း
async function loadCustomerInsights(customerId) {
    // Customer အခြေခံအချက်အလက်များကို ရယူခြင်း
    const { data: customer, error: cError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

    // အော်ဒါမှတ်တမ်းဟောင်းများကို ရယူခြင်း
    const { data: history, error: hError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    if (customer) {
        document.getElementById('cust-name').innerText = customer.full_name;
        document.getElementById('cust-phone').innerText = customer.phone_number;
        document.getElementById('cust-points').innerText = `${customer.total_points} Points`;
        document.getElementById('cust-total-spent').innerText = `${customer.lifetime_value.toLocaleString()} MMK`;
        document.getElementById('cust-total-orders').innerText = history.length;
        
        // VIP Level သတ်မှတ်ချက် (ဥပမာ- ၁ သိန်းဖိုးကျော်ရင် Gold)
        document.getElementById('cust-level').innerText = customer.lifetime_value > 100000 ? 'Gold Member' : 'Regular';
    }

    // ၂။ အော်ဒါမှတ်တမ်းဟောင်းများကို ပြသခြင်း
    const historyContainer = document.getElementById('customer-order-history');
    historyContainer.innerHTML = history.map(h => `
        <div class="history-item">
            <div class="history-date">${new Date(h.created_at).toLocaleDateString()}</div>
            <div class="history-details">
                <p>${h.order_status} - ${h.total_amount.toLocaleString()} MMK</p>
            </div>
        </div>
    `).join('');
}

