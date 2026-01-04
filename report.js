async function loadReports() {
    // ၁။ ဒီနေ့ရောင်းရငွေ တွက်ခြင်း
    const today = new Date().toISOString().split('T')[0];
    const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'Paid')
        .gte('created_at', today);

    const revenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    document.getElementById('today-revenue').innerText = `${revenue.toLocaleString()} MMK`;

    // ၂။ အသုံးစရိတ် နှုတ်ပြီး အမြတ်တွက်ခြင်း
    const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('created_at', today);

    const totalExp = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = revenue - totalExp;
    document.getElementById('net-profit').innerText = `${netProfit.toLocaleString()} MMK`;
}
