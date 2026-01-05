let salesChart;

// ၁။ စာမျက်နှာစဖွင့်ချိန်တွင် Report များကို load လုပ်ရန်
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('report-date-picker');
    if(dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        loadReports();
    }
});

// ၂။ အရောင်း၊ အမြတ်နှင့် အရောင်းရဆုံးပစ္စည်းများ တွက်ချက်ခြင်း
async function loadReports() {
    const selectedDate = document.getElementById('report-date-picker').value;
    const startOfDay = `${selectedDate}T00:00:00`;
    const endOfDay = `${selectedDate}T23:59:59`;
    
    // အရောင်းဒေတာ ဆွဲထုတ်ခြင်း
    const { data: orders, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

    if (orderErr) return console.error(orderErr);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    document.getElementById('today-revenue').innerText = `${totalRevenue.toLocaleString()} MMK`;

    // အသုံးစရိတ် ဆွဲထုတ်ခြင်း
    const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

    const totalExpense = expenses ? expenses.reduce((sum, e) => sum + (e.amount || 0), 0) : 0;
    
    // အသားတင်အမြတ် တွက်ချက်ခြင်း
    const netProfit = totalRevenue - totalExpense;
    const profitEl = document.getElementById('net-profit');
    profitEl.innerText = `${netProfit.toLocaleString()} MMK`;
    profitEl.style.color = netProfit >= 0 ? '#00b894' : '#ff7675';

    // Chart နှင့် List များ Update လုပ်ခြင်း
    updateSalesChart(totalRevenue, totalExpense);
    renderExpenseList(expenses || []);
    calculateTopItems(orders);
}

// ၃။ Chart.js ဖြင့် Doughnut Graph ဆွဲခြင်း
function updateSalesChart(revenue, expense) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    if (salesChart) salesChart.destroy();

    salesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenue', 'Expenses'],
            datasets: [{
                data: [revenue, expense],
                backgroundColor: ['#FF4500', '#dfe6e9'],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ၄။ အသုံးစရိတ်အသစ် ထည့်သွင်းခြင်း
async function saveExpense() {
    const title = document.getElementById('exp-title').value;
    const amount = document.getElementById('exp-amt').value;

    if (!title || !amount) return alert("စာရင်းအမည်နှင့် ပမာဏ ထည့်ပါ");

    const { error } = await supabase.from('expenses').insert([{
        title: title,
        amount: parseFloat(amount)
    }]);

    if (!error) {
        document.getElementById('exp-title').value = '';
        document.getElementById('exp-amt').value = '';
        loadReports();
    }
}

function renderExpenseList(expenses) {
    const list = document.getElementById('expense-list');
    list.innerHTML = expenses.map(e => `
        <div class="history-item" style="margin: 5px 0; padding: 10px; background: rgba(0,0,0,0.02);">
            <span style="font-size: 13px;">${e.title}</span>
            <span style="font-weight:600; color: #ff7675;">-${e.amount.toLocaleString()} K</span>
        </div>
    `).join('');
}

function calculateTopItems(orders) {
    let itemCounts = {};
    orders.forEach(order => {
        let items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        if (items) {
            items.forEach(item => {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.qty || 1);
            });
        }
    });
    // အစ်ကို့ဆီမှာ Best Sellers ပြဖို့ ID ရှိရင် ဒီနေရာမှာ ထည့်သုံးလို့ရပါတယ်
}
