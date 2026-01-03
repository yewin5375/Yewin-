// ၁။ Menu များကို ဆွဲထုတ်ပြသခြင်း (Edit နဲ့ Delete ခလုတ်များပါဝင်သည်)
async function loadMenuItems() {
    try {
        const { data, error } = await window.sb
            .from('menu')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const listDiv = document.getElementById('menu-list');
        if (!listDiv) return;

        if (data.length === 0) {
            listDiv.innerHTML = "<p style='padding:20px;'>Menu မရှိသေးပါ။ အသစ်ထည့်ရန် ခလုတ်ကိုနှိပ်ပါ။</p>";
            return;
        }

        listDiv.innerHTML = data.map(item => `
            <div class="stat-card">
                <img src="${item.image_url || 'https://via.placeholder.com/150'}" 
                     style="width:100%; height:150px; object-fit:cover; border-radius:15px;">
                <h4 style="margin:10px 0 5px 0;">${item.name}</h4>
                <p style="color:var(--primary); font-weight:bold; margin:5px 0;">${Number(item.price).toLocaleString()} Ks</p>
                
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button onclick='openMenuModal(true, ${JSON.stringify(item).replace(/'/g, "&apos;")})' 
                        style="flex:1; background:#3498db; font-size:12px;">Edit</button>
                    
                    <button onclick="toggleAvailability(${item.id}, ${!item.is_available})" 
                        style="flex:1; font-size:10px; background:${item.is_available ? '#28a745' : '#777'}">
                        ${item.is_available ? 'In Stock' : 'Out of Stock'}
                    </button>

                    <button onclick="confirmDelete(${item.id}, '${item.name}')" 
                        style="background:#e74c3c; padding:10px;">🗑</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Menu Load Error:", e.message);
    }
}

// ၂။ Pop-up (Modal) ဖွင့်ခြင်း/ပိတ်ခြင်း
function openMenuModal(isEdit = false, item = null) {
    document.getElementById('menuModal').style.display = 'flex';
    if (isEdit && item) {
        document.getElementById('modalTitle').innerText = "Edit Menu";
        document.getElementById('editItemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemCategory').value = item.category;
    } else {
        document.getElementById('modalTitle').innerText = "Add New Menu";
        document.getElementById('editItemId').value = "";
        document.getElementById('itemName').value = "";
        document.getElementById('itemPrice').value = "";
    }
}

function closeMenuModal() {
    document.getElementById('menuModal').style.display = 'none';
}

// ၃။ Menu သိမ်းဆည်းခြင်း (Add သို့မဟုတ် Update)
async function handleMenuSave() {
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('itemName').value;
    const price = document.getElementById('itemPrice').value;
    const category = document.getElementById('itemCategory').value;
    const file = document.getElementById('itemImage').files[0];
    const btn = document.getElementById('uploadBtn');

    if (!name || !price) return alert("ကျေးဇူးပြု၍ အချက်အလက်စုံအောင်ဖြည့်ပါ!");

    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
        let imageUrl = null;

        // ပုံအသစ်ပါလျှင် Upload အရင်လုပ်မည်
        if (file) {
            const fileName = `${Date.now()}_${file.name}`;
            const { error: uploadError } = await window.sb.storage
                .from('menu-images')
                .upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: urlData } = window.sb.storage
                .from('menu-images')
                .getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
        }

        if (id) {
            // Edit လုပ်ခြင်း (Update)
            const updateData = { name, price: Number(price), category };
            if (imageUrl) updateData.image_url = imageUrl; // ပုံအသစ်ပါမှ update လုပ်မည်

            const { error } = await window.sb.from('menu').update(updateData).eq('id', id);
            if (error) throw error;
            alert("Update လုပ်ပြီးပါပြီ!");
        } else {
            // အသစ်ထည့်ခြင်း (Insert)
            if (!file) {
                alert("ပုံထည့်ပေးရန် လိုအပ်ပါသည်!");
                btn.innerText = "Save Menu";
                btn.disabled = false;
                return;
            }
            const { error } = await window.sb.from('menu').insert([
                { name, price: Number(price), category, image_url: imageUrl }
            ]);
            if (error) throw error;
            alert("Menu အသစ်ထည့်သွင်းပြီးပါပြီ!");
        }

        closeMenuModal();
        loadMenuItems();
        // Form ရှင်းလင်းခြင်း
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemImage').value = '';
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        btn.innerText = "Save Menu";
        btn.disabled = false;
    }
}

// ၄။ ပစ္စည်း ရှိ/မရှိ အဖွင့်အပိတ်လုပ်ခြင်း
async function toggleAvailability(id, status) {
    const { error } = await window.sb.from('menu').update({ is_available: status }).eq('id', id);
    if (!error) loadMenuItems();
}

// ၅။ Menu ဖျက်ခြင်း (၂ ဆင့်မေးခြင်း)
async function confirmDelete(id, name) {
    const firstCheck = confirm(`"${name}" ကို ဖျက်မှာ သေချာပါသလား?`);
    if (firstCheck) {
        const secondCheck = confirm(`သတိပေးချက် - ဤ menu ကို ဖျက်လိုက်ပါက ပြန်ယူ၍မရတော့ပါ။ တကယ်ပဲ ဖျက်မှာလား?`);
        if (secondCheck) {
            const { error } = await window.sb.from('menu').delete().eq('id', id);
            if (!error) {
                alert("ဖျက်ပြီးပါပြီ။");
                loadMenuItems();
            }
        }
    }
        }

