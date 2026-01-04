// ၁။ Customer များ Load လုပ်ခြင်း (Search ပါဝင်သည်)
async function loadCustomers(search = '') {
    const listDiv = document.getElementById('customer-list');
    if (!listDiv) return;

    try {
        // Blueprint: Top Customer Ranking အတွက် Spent အများဆုံးကနေ စီမည်
        let query = window.sb.from('customers')
            .select('*')
            .order('total_spent', { ascending: false });
        
        // ဖုန်းနံပါတ် သို့မဟုတ် အမည်ဖြင့် ရှာဖွေခြင်း
        if (search) {
            query = query.or(`phone.ilike.%${search}%,name.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        // UI Header နှင့် Search Box
        let html = `
            <div class="customer-search-box" style="margin-bottom: 25px; position: sticky; top: 0; background: #fdfdfd; z-index: 10; padding: 10px 0;">
                <input type="text" placeholder="ဖုန်း သို့မဟုတ် အမည်ဖြင့် ရှာပါ..." 
                       value="${search}"
                       oninput="loadCustomers(this.value)" 
                       class="search-input-pearl"
                       style="width:100%; padding:15px; border-radius:18px; border: 2px solid #f1f5f9; font-size:16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
            </div>
        `;

        if (data.length === 0) {
            html += `<div style="text-align:center; padding:50px; color:#94a3b8;">Customer ရှာမတွေ့ပါဗျာ။</div>`;
        } else {
            html += `<div class="customer-grid" style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                ${data.map((c, index) => renderCustomerCard(c, index)).join('')}
            </div>`;
        }

        listDiv.innerHTML = html;

    } catch (e) {
        console.error("Customer Error:", e.message);
        listDiv.innerHTML = `<p style="color:red; text-align:center;">Error: ${e.message}</p>`;
    }
}

// ၂။ Customer Card တစ်ခုချင်းစီ၏ UI (Blueprint VIP Style)
function renderCustomerCard(c, index) {
    // Top 3 Customers ကို Badge လေးတွေနဲ့ ပြပေးမယ်
    const crown = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
    
    return `
        <div class="order-card-new" style="border-left: 5px solid ${index < 3 ? 'var(--primary)' : '#e2e8f0'};">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <h3 style="margin:0; font-size:18px; display:flex; align-items:center; gap:8px;">
                        <span>${crown}</span> ${c.name || 'VIP Customer'}
                    </h3>
                    <div class="info-row" style="margin-top:5px;">📱 <b>${c.phone}</b></div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px; color:#94a3b8; font-weight:700;">LOYALTY POINTS</div>
                    <div style="color:#e67e22; font-weight:900; font-size:18px;">⭐ ${c.points || 0}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #f1f5f9;">
                <div style="background:#f8fafc; padding:10px; border-radius:12px; text-align:center;">
                    <small style="color:#94a3b8; display:block;">Total Orders</small>
                    <b style="font-size:16px; color:#334155;">📦 ${c.total_orders || 0}</b>
                </div>
                <div style="background:#fff7ed; padding:10px; border-radius:12px; text-align:center;">
                    <small style="color:#94a3b8; display:block;">Total Spent</small>
                    <b style="font-size:16px; color:var(--primary);">${Number(c.total_spent || 0).toLocaleString()} Ks</b>
                </div>
            </div>
            
            <button class="btn-status-step" style="width:100%; margin-top:15px; background:#f1f5f9; border:none; color:#64748b;" 
                    onclick="viewCustomerHistory('${c.phone}')">
                မှာယူမှုမှတ်တမ်း ကြည့်ရန်
            </button>
        </div>
    `;
}

// ၃။ Customer မှာယူဖူးသည့် မှတ်တမ်း (Order History Timeline)
async function viewCustomerHistory(phone) {
    try {
        const { data, error } = await window.sb
            .from('orders')
            .select('*')
            .eq('customer_phone', phone)
            .order('created_at', { ascending: false });

        if (error) throw error;

        let historyHtml = data.map(o => `
            <div style="padding:10px; border-bottom:1px solid #eee;">
                <div style="display:flex; justify-content:space-between;">
                    <small>${new Date(o.created_at).toLocaleDateString()}</small>
                    <small style="color:var(--primary); font-weight:bold;">${Number(o.total_amount).toLocaleString()} Ks</small>
                </div>
                <div style="font-size:13px; color:#444;">${o.items.map(i => i.name).join(', ')}</div>
            </div>
        `).join('') || '<p>မှတ်တမ်းမရှိသေးပါ။</p>';

        // ရိုးရိုး Alert ထက် Modal နဲ့ပြရင် ပိုလှပါတယ် (အခုလောလောဆယ် Alert နဲ့ အရင်ပြထားမယ်)
        alert(`ဖုန်းနံပါတ် ${phone} ၏ မှာယူမှုမှတ်တမ်း:\n\n${data.length} ကြိမ် မှာယူထားပါသည်။`);
        console.log("Customer History:", data);
    } catch (e) {
        alert(e.message);
    }
}

