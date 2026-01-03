const onst firebaseC = i
   {
  a: Key: "AIzaSyCW_jACdwWmN2nwlEOxR6tdTBqLXHy,
  ",
  authD: ain: "myin-thar-chicken-bbq.firebaseapp,
  ",
  proj: tId: "myin-thar-chicken,
  ",
  storageB: ket: "myin-thar-chicken-bbq.firebasestorage,
  ",
  messagingSen: rId: "4563913,
  ",
  : pId: "1:45639130854:web:779ecef328580d10e9
5;


};

fir.base.initializeApp(firebaseCo;
ig);
 onst mess = ng = fir.base.messag;

();

// app.js ထဲက initNotification function ကို ဒါလေးနဲ့ အစားထိုးလိ


ပါ


// app.js ထဲက initNotification အပိုင်းမှာ ဒါလေး ပါရ
ါမယ်
 sync fun tion initNotificat o
    
     onst permi = on =  wait Notific.tion.requestPermiss;
    
    if (permi ===  === 'gran e
             // Service worker ကို register လုပ်တာ သေချ
              onst registr = on =  wait navi.ator.serviceW.rker.register('firebase-messaging-sw;
        
              onst  = en =  wait mess.ging.getTo
                 serviceWorkerRegistr: ion: registr, ion, // ဒါကို ထည့်ပေးရ
                 vap: Key: "BKEpbLekJWc0eS5TDIKyB-Wp79lnfff9wF3ivDJj0LQG_s5Z7R2kKasvRAOaMvTxkRS6rkPfdIqLaIqR50O
          ;
        
             if (t k
                  wait w.nd.w.sb.from('user_tok.ns').upse t([{ : ken:  ok,   ], { onCon: ict: 't ke;
                 co.sole.log("Token Saved Successful;
         
    

 



}


 sync fun tion loadDashbo r
    
     o st {, ata,  r =  } =  wait w.nd.w.sb.from('ord.rs').select;
    
   !if (!e r
             doc.ment.getElementById('todayOrd.rs').inne = xt =.data.l + th + " Or;
              onst  = al =.data.redu, (( => ) +  s + Num.er(o.total_a || t ,  0;
             doc.ment.getElementById('todayReve.ue').inne = xt = .otal.toLocaleStr + () + ;
    

 

}
}

 sync fun tion loadCustom {
    
     o st {, ata,  r =  } =  wait w.nd.w.sb.from('custom.rs').select.'*').order('total_s, n ', { asce: ing:  al;
    
     onst li = iv = doc.ment.getElementById('customer-l;
    
   !if (!e r
             li.tDiv.inne = ML =.data. => c => `
            <div class="stat-card" style="text-align:left;">
                <b>�. ${c || e || 'Unknown'}.(${c.phone})</b>
                <p>Total Spent: ${Num.er(c.total_s.ent).toLocaleString()} Ks</p>
                <p>Points. ${c.points} pts | Orders. ${c.total_orders}</p>
            </div>
     .  `).joi;
    

}
// app.js ထဲမှာ ဒါလေးတွေ ထပ်ဖြည့်ပါ
async function loadDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // ဒီနေ့အော်ဒါများယူခြင်း
    const { data: orders, error } = await window.sb
        .from('orders')
        .select('total_amount')
        .gte('created_at', today);

    if (!error) {
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        document.getElementById('todayOrders').innerText = orders.length;
        document.getElementById('todayRevenue').innerText = totalRevenue.toLocaleString() + " Ks";
    }
}

// window.onload မှာ ဒါလေးပြောင်းပါ
window.onload = () => {
    showView('dashboard');
    loadDashboardStats(); // Dashboard ကိန်းဂဏန်းများတင်ရန်
    setInterval(loadDashboardStats, 30000); // ၃၀ စက္ကန့်တစ်ခါ Update လုပ်ရန်
};



