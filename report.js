// ၁။ Chart ကို သိမ်းဆည်းရန် Variable
let salesChart = null;

// ၂။ Report Data များကို Load လုပ်ခြင်း
async function loadReports() {
    const selectedDate = document.getElementById('report-date').value || new Date().toISOString().split('T')[0];
    
    try {
        // ၂.၁ အရောင်းဒေတာများ ဆွဲယူခြင်း (Order Items + Menu for Cost Price)
        const { data: reportData, error } = await supabase
            .from('order_items')
            .select(`
                quantity, 
                unit_price, 
                created_at,
                menu (cost_price)
            `)
            .gte('created_at', selectedDate + 'T00:00:00')
            .lte('created_at', selectedDate + 'T23:59:59');

        if (error) throw error;

        // ၂.၂ အမြတ်တွက်ချက်ခြင်း
        let totalRevenue = 0;
        let totalCost = 0;

        reportData.forEach(item => {
            const revenue = item.unit_price * item.quantity;
            const cost = (item.menu?.cost_price || 0) * item.quantity;
            
            totalRevenue += revenue;
            totalCost += cost;
        });

        const netProfit = totalRevenue - totalCost;

        // ၂.၃ Summary UI ကို Update လုပ်ခြင်း
        updateReportSummary(totalRevenue, netProfit);

        // ၂.၄ Chart ဆွဲရန် Data ပြင်ဆင်ခြင်း (ယခုလအတွင်း နေ့အလိုက် အရောင်းပြရန်)
        await renderSalesChart();

    } catch (err) {
        console.error("Report Error:", err.message);
    }
}

// ၃။ Summary UI Display
function updateReportSummary(rev, profit) {
    const summaryDiv = document.getElementById('report-summary');
    summaryDiv.innerHTML = `
        <div class="summary-container">
            <div class="sum-box">
                <span class="label">Total Revenue</span>
                <span class="val">${rev.toLocaleString()} K</span>
            </div>
            <div class="sum-box">
                <span class="label">Total Cost</span>
                <span class="val">${(rev - profit).toLocaleString()} K</span>
            </div>
            <div class="sum-box highlight">
                <span class="label">Net Profit</span>
                <span class="val" style="color: #2ecc71;">${profit.toLocaleString()} K</span>
            </div>
        </div>
    `;
}

// ၄။ Chart.js ဖြင့် Graph ဆွဲခြင်း
async function renderSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // နောက်ဆုံး ၇ ရက်စာ ဒေတာယူခြင်း
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: chartData } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

    // နေ့အလိုက် Data စုစည်းခြင်း
    const dailyMap = {};
    chartData.forEach(o => {
        const date = new Date(o.created_at).toLocaleDateString();
        dailyMap[date] = (dailyMap[date] || 0) + Number(o.total_amount);
    });

    const labels = Object.keys(dailyMap);
    const totals = Object.values(dailyMap);

    // Chart အဟောင်းရှိလျှင် ဖျက်မည်
    if (salesChart) salesChart.destroy();

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Sales (K)',
                data: totals,
                borderColor: '#6c5ce7',
                backgroundColor: 'rgba(108, 92, 231, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// စတင်ချိန်တွင် Load လုပ်ရန်
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('report-page')) {
        loadReports();
    }
});
