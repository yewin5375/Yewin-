// ၁။ Firebase Libraries များကို ချိတ်ဆက်ခြင်း
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// ၂။ Firebase ကို ပဏာမ ခြေလှမ်းအဖြစ် သတ်မှတ်ခြင်း (Initialize)
// သင့်ရဲ့ Firebase Config ကို အတိအကျ သုံးထားပါတယ်
firebase.initializeApp({
  apiKey: "AIzaSyCW_jACdwWmN2nwlEOxR6tdTBqLXHyvE0w",
  projectId: "myin-thar-chicken-bbq",
  messagingSenderId: "45639130854",
  appId: "1:45639130854:web:779ecef328580d10e9e527"
});

const messaging = firebase.messaging();

// ၃။ Background မှာ Notification ကို လက်ခံရယူခြင်း
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png' // သင့်မှာ icon ရှိရင် ထည့်ပေးပါ
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

