let myChart;

async function loadReports() {
    const selectedDate = document.getElementById('report-date-picker').value || new Date().toISOString().split('T')[0];

    // ၁။ ဒီနေ့ရောင်းရငွေ (Revenue) ဆွဲထုတ်ခြင်း
    const { data: sales } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'Paid')
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`);

    const totalRev = sales.reduce((sum, item) => sum + item.total_amount, 0);
    document.getElementById('today-revenue').innerText = `${totalRev.toLocaleString()} K`;

    // ၂။ အသုံးစရိတ် (Expenses) ဆွဲထုတ်ခြင်း
    const { data: exps } = await supabase
        .from('expenses')
        .select('amount')
        .gte('created_at', `${selectedDate}T00:00:00`);

    const totalExp = exps.reduce((sum, item) => sum + item.amount, 0);
    
    // ၃။ အသားတင်အမြတ် (Net Profit)
    const netProfit = totalRev - totalExp;
    document.getElementById('net-profit').innerText = `${netProfit.toLocaleString()} K`;

    updateChart(totalRev, totalExp);
}

// Graph ဆွဲသည့် Function
function updateChart(rev, exp) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenue', 'Expenses'],
            datasets: [{
                data: [rev, exp],
                backgroundColor: ['#00b894', '#fab1a0'],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

