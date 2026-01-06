let unreadCount = 0;

// ၁။ Notification နားထောင်ခြင်း (Supabase Real-time)
supabase.channel('orders-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        const newOrder = payload.new;
        showNotification(
            "အော်ဒါအသစ်ရရှိပါသည်!", 
            `ဖောက်သည်: ${newOrder.customer_name} (${newOrder.total_amount} K)`,
            'order-page' // နှိပ်ရင်သွားရမယ့် နေရာ
        );
    }).subscribe();

// ၂။ Notification ပြသခြင်း (Sound + Visual + Browser/Phone Noti)
function showNotification(title, body, targetPage) {
    // (က) အသံမြည်ခြင်း
    const audio = new Audio('notification.mp3'); 
    audio.play().catch(e => console.log("Sound muted by browser"));

    // (ခ) Badge (အနီစက်) တိုးခြင်း
    unreadCount++;
    const badge = document.getElementById('noti-badge');
    badge.innerText = unreadCount;
    badge.classList.remove('hidden');

    // (ဂ) Noti List ထဲသို့ ထည့်ခြင်း
    const notiList = document.getElementById('noti-list');
    const newNoti = document.createElement('div');
    newNoti.className = 'noti-item unread';
    newNoti.onclick = () => {
        changeNav(targetPage); // သက်ဆိုင်ရာ စာမျက်နှာသို့ သွားမည်
        newNoti.classList.remove('unread');
        toggleNotiPanel();
    };
    newNoti.innerHTML = `
        <strong>${title}</strong>
        <p>${body}</p>
        <small>${new Date().toLocaleTimeString()}</small>
    `;
    notiList.prepend(newNoti);

    // (ဃ) Browser/Phone Notification Bar တွင်ပြသခြင်း
    if (Notification.permission === "granted") {
        new Notification(title, { body: body, icon: 'icon.png' });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

// Noti Panel ဖွင့်/ပိတ် လုပ်ခြင်း
function toggleNotiPanel() {
    document.getElementById('noti-panel').classList.toggle('hidden');
    // Panel ဖွင့်လိုက်ရင် Badge ကို ဖျောက်မည်
    unreadCount = 0;
    document.getElementById('noti-badge').classList.add('hidden');
}

