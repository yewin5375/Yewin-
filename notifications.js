// notifications.js

function listenToOrders() {
    // window.sb ကို သုံးပြီး Realtime နားထောင်မယ်
    window.sb
        .channel('custom-all-channel')
        .on(
            'postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'orders' }, 
            (payload) => {
                console.log('New Order Received!', payload.new);
                showBrowserNotification(payload.new);
                
                // Dashboard နဲ့ Order စာရင်းကို ချက်ချင်း update လုပ်မယ်
                if (typeof loadDashboard === 'function') loadDashboard();
                if (typeof loadOrders === 'function') loadOrders();
            }
        )
        .subscribe();
}

function showBrowserNotification(order) {
    if (Notification.permission === "granted") {
        new Notification("အော်ဒါအသစ်တက်လာပါပြီ!", {
            body: `${order.customer_name} ထံမှ ${Number(order.total_amount).toLocaleString()} Ks ဖိုး အော်ဒါရရှိပါတယ်`,
        });
    }
}
