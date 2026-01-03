// ၁။ Menu များကို ဆွဲထုတ်ပြသခြင်း (Premium Grid Layout)
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
            listDiv.innerHTML = "<p style='padding:20px; text-align:center;'>Menu မရှိသေးပါ။ + ခလုတ်ကိုနှိပ်ပြီး အသစ်ထည့်ပါ။</p>";
            return;
        }

        // Card ဒီဇိုင်းကို ပိုမို Premium ဖြစ်အောင် ပြောင်းလဲထားသည်
        // loadMenuItems ထဲက Button အပိုင်းကိုပဲ ပြောင်းလဲဖော်ပြပေးထားပါတယ်
listDiv.innerHTML = data.map(item => `
    <div class="menu-item-card">
        <div class="card-image-wrapper">
            <img src="${item.image_url || 'https://via.placeholder.com/150'}">
            <div class="availability-badge" style="background: ${item.is_available ? '#28a745' : '#dc3545'}">
                ${item.is_available ? 'In Stock' : 'Out of Stock'}
            </div>
        </div>
        <div class="card-details">
            <h4>${item.name}</h4>
            <p class="price">${Number(item.price).toLocaleString()} Ks</p>
            
            <div class="card-actions">
                <button class="btn-edit" onclick='openMenuModal(true, ${JSON.stringify(item).replace(/'/g, "&apos;")})'>
                   ✏️ Edit Menu
                </button>
                <button class="btn-delete" onclick="confirmDelete(${item.id}, '${item.name}')">
                    🗑️
                </button>
            </div>
        </div>
    </div>
`).join('');
        
        
    } catch (e) {
        console.error("Menu Load Error:", e.message);
    }
}

// ၂။ Pop-up (Modal) ဖွင့်ခြင်း/ပိတ်ခြင်း
function openMenuModal(isEdit = false, item = null) {
    const modal = document.getElementById('menuModal');
    modal.style.display = 'flex';
    
    if (isEdit && item) {
        document.getElementById('modalTitle').innerText = "Edit Menu Item";
        document.getElementById('editItemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('uploadBtn').innerText = "Update Menu";
    } else {
        document.getElementById('modalTitle').innerText = "Add New Menu";
        document.getElementById('editItemId').value = "";
        document.getElementById('itemName').value = "";
        document.getElementById('itemPrice').value = "";
        document.getElementById('uploadBtn').innerText = "Save Menu";
    }
}

function closeMenuModal() {
    document.getElementById('menuModal').style.display = 'none';
}

// ၃။ Menu သိမ်းဆည်းခြင်း (Add သို့မဟုတ် Update Logic)
async function handleMenuSave() {
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('itemName').value;
    const price = document.getElementById('itemPrice').value;
    const category = document.getElementById('itemCategory').value;
    const fileInput = document.getElementById('itemImage');
    const file = fileInput.files[0];
    const btn = document.getElementById('uploadBtn');

    if (!name || !price) return alert("အချက်အလက်စုံအောင် ဖြည့်ပေးပါ!");

    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        let imageUrl = null;

        // ပုံအသစ်တင်သည့် အပိုင်း
        if (file) {
            const fileName = `${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await window.sb.storage
                .from('menu-images')
                .upload(fileName, file);
            
            if (uploadError) throw uploadError;

            const { data: urlData } = window.sb.storage
                .from('menu-images')
                .getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
        }

        if (id) {
            // Update လုပ်ငန်းစဉ်
            const updateData = { name, price: Number(price), category };
            if (imageUrl) updateData.image_url = imageUrl;

            const { error } = await window.sb.from('menu').update(updateData).eq('id', id);
            if (error) throw error;
            alert("ပြင်ဆင်ပြီးပါပြီ!");
        } else {
            // အသစ်ထည့်သည့် လုပ်ငန်းစဉ်
            if (!imageUrl) return alert("ပုံရွေးပေးရန် လိုအပ်ပါသည်!");
            
            const { error } = await window.sb.from('menu').insert([
                { name, price: Number(price), category, image_url: imageUrl, is_available: true }
            ]);
            if (error) throw error;
            alert("Menu အသစ် ထည့်ပြီးပါပြီ!");
        }

        closeMenuModal();
        loadMenuItems();
        // Reset Form
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        fileInput.value = '';
        
    } catch (e) {
        alert("အမှားတစ်ခု ဖြစ်သွားသည်: " + e.message);
    } finally {
        btn.innerText = id ? "Update Menu" : "Save Menu";
        btn.disabled = false;
    }
}

// ၄။ ပစ္စည်း ရှိ/မရှိ အဖွင့်အပိတ် (Quick Toggle)
async function toggleAvailability(id, status) {
    const { error } = await window.sb.from('menu').update({ is_available: status }).eq('id', id);
    if (!error) loadMenuItems();
}

// ၅။ Menu ဖျက်ခြင်း (Double Confirmation)
async function confirmDelete(id, name) {
    const firstCheck = confirm(`"${name}" ကို ဖျက်ရန် သေချာပါသလား?`);
    if (firstCheck) {
        const secondCheck = confirm(`သတိပေးချက်: ပြန်ယူ၍ မရနိုင်တော့ပါ။ အတည်ပြုပါသလား?`);
        if (secondCheck) {
            const { error } = await window.sb.from('menu').delete().eq('id', id);
            if (!error) {
                alert("ဖျက်ပြီးပါပြီ။");
                loadMenuItems();
            }
        }
    }
}

