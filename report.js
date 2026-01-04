let salesChart;

// ၁။ စာမျက်နှာစဖွင့်ချိန်တွင် Report များကို load လုပ်ရန်
document.addEventListener('DOMContentLoaded', () => {
    // ယနေ့ရက်စွဲကို default ထည့်ရန်
    const dateInput = document.getElementById('report-date-picker');
    if(dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        loadReports();
    }
});

// ၂။ အရောင်းနှင့် အမြတ်ကို တွက်ချက်ခြင်း
async function loadReports() {
    const selectedDate = document.getElementById('report-date-picker').value;
    
    // အရောင်းဒေတာ ဆွဲထုတ်ခြင်း (Paid ဖြစ်ပြီးသား အော်ဒါများသာ)
    const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'Paid')
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`);

    const totalRevenue = orders ? orders.reduce((sum, o) => sum + o.total_amount, 0) : 0;
    document.getElementById('today-revenue').innerText = `${totalRevenue.toLocaleString()} MMK`;

    // အသုံးစရိတ် ဆွဲထုတ်ခြင်း
    const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`);

    const totalExpense = expenses ? expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
    
    // အသားတင်အမြတ် တွက်ချက်ခြင်း
    const netProfit = totalRevenue - totalExpense;
    const profitEl = document.getElementById('net-profit');
    profitEl.innerText = `${netProfit.toLocaleString()} MMK`;
    profitEl.style.color = netProfit >= 0 ? '#00b894' : '#ff7675';

    // Graph ဆွဲရန် function ခေါ်ခြင်း
    updateSalesChart(totalRevenue, totalExpense);
    renderExpenseList(expenses || []);
}

// ၃။ Chart.js ဖြင့် Graph ဆွဲခြင်း
function updateSalesChart(revenue, expense) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    if (salesChart) salesChart.destroy(); // အဟောင်းကို ဖျက်ပြီးမှ အသစ်ဆွဲရန်

    salesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenue', 'Expenses'],
            datasets: [{
                data: [revenue, expense],
                backgroundColor: ['#FF4500', '#dfe6e9'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            cutout: '70%'
        }
    });
}

// ၄။ အသုံးစရိတ်အသစ် ထည့်သွင်းခြင်း
async function saveExpense() {
    const title = document.getElementById('exp-title').value;
    const amount = document.getElementById('exp-amt').value;

    if (!title || !amount) return alert("Description နှင့် Amount ထည့်ပါ");

    const { error } = await supabase.from('expenses').insert([{
        title: title,
        amount: parseFloat(amount)
    }]);

    if (!error) {
        document.getElementById('exp-title').value = '';
        document.getElementById('exp-amt').value = '';
        loadReports(); // စာရင်းပြန် update လုပ်ရန်
    }
}

function renderExpenseList(expenses) {
    const list = document.getElementById('expense-list');
    list.innerHTML = expenses.map(e => `
        <div class="history-item">
            <span>${e.title}</span>
            <span style="font-weight:600;">-${e.amount.toLocaleString()} K</span>
        </div>
    `).join('');
}


