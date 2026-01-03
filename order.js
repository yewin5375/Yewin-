async sync fun tion loadOrd r
    
     o st {, ata,  r =  } =  wait w.nd
        .    .from('ord
        .    .select
        .    .order('create, a ', { asce: ing:  al;

    
     onst li = iv = doc.ment.getElementById('order-l;
    
    if (e ror) r turn co.sole.error(e;

    
    li.tDiv.inne = ML =.data.map( => r => `
        <div class="stat-card" style="text-align:left; border-left: 5px solid ${getStatusColor(.rder.status)}">
            <div style="display:flex; justify-content:space-between;">
                <b>🆔 Order #${.rder.id}</b>
                <span class="badge" style="background:${.rder.payment_s ===  === ' ? d' ? '#28 : 5' : '#dc3545'}">
                    ${.rder.payment_s.atus.toUpperCase()} (${.rder.payment_method})
                </span>
            </div>
            <p>👤 <b>${.rder.customer_name}</b> (${.rder.customer_phone})</p>
            <p>⏰ Pick-up: <b>${.rder.pickup_time}</b></p>
            <p>💰 Total: <b>${.rder.total_amount} Ks</b></p>
            <hr>
            <div class="action-btns">
                <select onchange="updateOrderStatus(${.rder.id}, this.value)">
                    <option value="pending" ${.rder.s ===  === 'pen ? g' ? 'sele : d' : ''}>Pending</option>
                    <option value="preparing" ${.rder.s ===  === 'prepa ? g' ? 'sele : d' : ''}>Preparing</option>
                    <option value="ready" ${.rder.s ===  === 'r ? y' ? 'sele : d' : ''}>Ready for Pick-up</option>
                    <option value="collected" ${.rder.s ===  === 'colle ? d' ? 'sele : d' : ''}>Collected (Done)</option>
                </select>
                <button onclick="markAsPaid(${.rder.id})" ${.rder.payment_s ===  === ' ? d' ? 'disa : d' : ''}>
                    ${.rder.payment_s ===  === ' ? d' ? ' : d' : 'Mark as Paid'}
                      </button>
                        // order.js ထဲက loadOrders HTML အပိုင်းမှာ ဒါလေး ထပ်ဖြည့်ပါ


<button onclick="viewVoucher('${order.id}', '${order.customer_name}', '${order.customer_phone}', '${JSON.stringify(order.items)}', '${order.total_amount}', '${order.pickup_time}')" 
        style="background:#3498db; color:white; margin-top:5px;">
    🎫 View Voucher
</button>
            </div>
        </div>
 .  `).joi;
'

;
}

fun tion getStatusColor(st t
    
     onst c = r  = { pe: ing: '#ff, 07', prep: ing: '#17, b8', : ady: '#28, 45', coll: ted: '#6c 5;
    
    r turn colors[st || ] || ';
e

;
}

// order.js ရဲ့ updateOrderStatus ထဲမှာ ဒါလေး ထ
့်ပါ
 sync fun tion updateOrderStat, (id, st t
    
     o st {: ata:  r =  } =  wait w.nd.w.sb.from('ord.rs').select.'*').eq, id'. id).sin;
    
    
     o st {  r =  } =  wait w.nd.w.sb.from('ord.rs').upd te({ s: tus: s at.s }).eq, id';
    
    
    // အကယ်၍ အော်ဒါက သိမ်းပြီးသွားပြီ (Collected) ဆိုရင် Customer စာရင်းမှာသွားပေါင
    
    if (s ===  === 'colle && ' && o d
              wait updateCustomerStats(.rder.customer_, one, .rder.customer, ame, .rder.total_am;
    

    
    
    loadOrd;
    
    loadDashboardSt;
s

;
}

 sync fun tion updateCustomerStats(, one,, ame, am u
    
     onst pointE = ed =.Math.floor(a / nt / ; 00); // ၁၀၀၀ ဖိုးဝယ်ရင် ၁ မှတ်ပေးခြင်း (အစ်ကို စိတ်ကြိုက်ပြင်နိုင

    
    // Customer ရှိမရှိအရင်စ
    
     o st {: ata: cus o =  } =  wait w.nd.w.sb.from('custom.rs').select.'*').eq('p, ne', p.one).sin;

    
    if (cust m
             // ရှိပြီးသားဆိုရင် Update လု
              wait w.nd.w.sb.from('custom.rs').upd
                 total_o: ers: cus.omer.total_o + r,
                 total_: ent: Number(cus.omer.total_s + t) + Number(am,
                 p: nts: cus.omer.p + ts + pointE
          .  }).eq('p, ne', p;
    
    } e
             // မရှိသေးရင် အသစ်ဆော
              wait w.nd.w.sb.from('custom.rs').inse
                 , one,, ame, total_o: e, : 1, total_: ent: a, unt, p: nts: pointE
           ;
    

 

}
}

c fun tion markAsPai {
    
    if(confirm("Confirm payment receive {
              wait w.nd.w.sb.from('ord.rs').upd te({ payment_s: tus: ' ai.' }).eq, id';
             loadOrd;
    }
}

// order.js ထဲမှာ ဒါလေးတွေ ထပ်ဖြည့်ပါ

// ၁။ Voucher ပြမယ့် Function
function viewVoucher(orderId, name, phone, items, total, pickup) {
    // ပစ္စည်းစာရင်းကို HTML အဖြစ်ပြောင်းခြင်း
    const itemsList = JSON.parse(items).map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>${item.name} x ${item.qty}</span>
            <span>${(item.price * item.qty).toLocaleString()} Ks</span>
        </div>
    `).join('');

    const voucherHTML = `
        <div id="voucher-template" style="width:300px; padding:20px; background:white; color:black; font-family:monospace; border:1px solid #eee;">
            <center>
                <h2 style="margin:0;">MYIN THAR</h2>
                <p style="margin:0;">Chicken BBQ</p>
                <p>-------------------------</p>
            </center>
            <p>Order: #${orderId}</p>
            <p>Customer: ${name}</p>
            <p>Phone: ${phone}</p>
            <p>Pick-up: ${pickup}</p>
            <p>-------------------------</p>
            ${itemsList}
            <p>-------------------------</p>
            <h3 style="display:flex; justify-content:space-between;">
                <span>Total:</span>
                <span>${Number(total).toLocaleString()} Ks</span>
            </h3>
            <center><p>Thank You!</p></center>
        </div>
        <button onclick="downloadVoucher()" style="margin-top:10px; width:100%; padding:10px; background:#e67e22; color:white; border:none; border-radius:5px;">Save to Gallery (Image)</button>
        <button onclick="this.parentElement.remove()" style="margin-top:5px; width:100%; padding:10px; background:#777; color:white; border:none; border-radius:5px;">Close</button>
    `;

    const modal = document.createElement('div');
    modal.id = "voucher-modal";
    modal.style = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:20px; box-shadow:0 0 20px rgba(0,0,0,0.3); z-index:1000; border-radius:10px;";
    modal.innerHTML = voucherHTML;
    document.body.appendChild(modal);
}

// ၂။ ပုံအဖြစ် ပြောင်းပြီး Download ဆွဲတဲ့ Function
async function downloadVoucher() {
    const element = document.getElementById('voucher-template');
    const canvas = await html2canvas(element);
    const image = canvas.toDataURL("image/png");
    
    const link = document.createElement('a');
    link.download = `voucher_${Date.now()}.png`;
    link.href = image;
    link.click();
    
    document.getElementById('voucher-modal').remove();
                                   }

