// js/notifications.js
import { supabase } from './supabase.js';

export function listenToOrders() {
    supabase
        .channel('schema-db-changes')
        .on(
            'postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'orders' }, 
            (payload) => {
                console.log('New Order Received!', payload.new);
                showNotification(payload.new);
                // အောက်က function က app.js ထဲမှာရှိတဲ့ list ကို update လုပ်ပေးမှာပါ
                if (typeof fetchOrders === 'function') fetchOrders(); 
            }
        )
        .subscribe();
}

function showNotification(order) {
    // Browser Notification ပြခြင်း
    if (Notification.permission === "granted") {
        new Notification("အော်ဒါအသစ်တက်လာပါပြီ!", {
            body: `${order.customer_name} ထံမှ $${order.total_amount} ဖိုး အော်ဒါရရှိပါတယ်`,
            icon: '/icon.png'
        });
    }
}
