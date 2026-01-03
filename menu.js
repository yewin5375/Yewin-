// ၁။ Menu များကို ဆွဲထုတ်ပြသခြင်း (Admin Page)
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

        // Card ဒီဇိုင်း (Stock Badge နှင့် Edit/Delete Buttons ပါဝင်သည်)
        listDiv.innerHTML = data.map(item => `
            <div class="menu-item-card" style="position:relative; animation: fadeInUp 0.4s ease forwards;">
                <div class="stock-badge">📦 Stock: ${item.stock || 0}</div>
                <div class="card-image-wrapper">
                    <img src="${item.image_url || 'https://via.placeholder.com/150'}" loading="lazy">
                </div>
                <div class="card-details">
                    <h4>${item.name}</h4>
                    <p class="price">${Number(item.price).toLocaleString()} Ks</p>
                    
                    <div class="menu-actions-box">
                        <button class="btn-edit-stock" onclick='openMenuModal(true, ${JSON.stringify(item).replace(/'/g, "&apos;")})'>
                           ✏️ Edit / Stock
                        </button>
                        <button class="btn-delete-item" onclick="confirmDelete(${item.id}, '${item.name}')">
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

// ၂။ Add/Edit Modal ဖွင့်ခြင်း (Stock Field ပါဝင်သည်)
function openMenuModal(isEdit = false, item = null) {
    const modal = document.getElementById('menuModal');
    modal.style.display = 'flex';
    
    if (isEdit && item) {
        document.getElementById('modalTitle').innerText = "Edit Menu Item";
        document.getElementById('editItemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemStock').value = item.stock || 0; // Stock တန်ဖိုးထည့်ခြင်း
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('uploadBtn').innerText = "Update Menu";
    } else {
        document.getElementById('modalTitle').innerText = "Add New Menu";
        document.getElementById('editItemId').value = "";
        document.getElementById('itemName').value = "";
        document.getElementById('itemPrice').value = "";
        document.getElementById('itemStock').value = "0"; // Stock အသစ်အတွက် 0 ထားခြင်း
        document.getElementById('itemCategory').value = "Main";
        document.getElementById('uploadBtn').innerText = "Save Menu";
    }
}

function closeMenuModal() {
    document.getElementById('menuModal').style.display = 'none';
}

// ၃။ Menu သိမ်းဆည်းခြင်း (Add/Update ပေါင်းထားသော Logic)
async function handleMenuSave() {
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('itemName').value;
    const price = document.getElementById('itemPrice').value;
    const stock = document.getElementById('itemStock').value; // Stock field ယူခြင်း
    const category = document.getElementById('itemCategory').value;
    const fileInput = document.getElementById('itemImage');
    const file = fileInput.files[0];
    const btn = document.getElementById('uploadBtn');

    if (!name || !price) return alert("အချက်အလက်စုံအောင် ဖြည့်ပေးပါ!");

    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        let imageUrl = null;

        // ပုံတင်သည့်အပိုင်း
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

        const menuData = { 
            name, 
            price: Number(price), 
            stock: Number(stock), // Stock အရေအတွက်သိမ်းမည်
            category 
        };
        if (imageUrl) menuData.image_url = imageUrl;

        if (id) {
            // Update
            const { error } = await window.sb.from('menu').update(menuData).eq('id', id);
            if (error) throw error;
            alert("ပြင်ဆင်ပြီးပါပြီ!");
        } else {
            // Insert New
            if (!imageUrl) return alert("ပုံရွေးပေးရန် လိုအပ်ပါသည်!");
            const { error } = await window.sb.from('menu').insert([menuData]);
            if (error) throw error;
            alert("Menu အသစ် ထည့်ပြီးပါပြီ!");
        }

        closeMenuModal();
        loadMenuItems(); // List ပြန်ခေါ်မည်
        
    } catch (e) {
        alert("အမှားတစ်ခု ဖြစ်သွားသည်: " + e.message);
    } finally {
        btn.innerText = id ? "Update Menu" : "Save Menu";
        btn.disabled = false;
    }
}

// ၄။ Menu ဖျက်ခြင်း
async function confirmDelete(id, name) {
    if (confirm(`"${name}" ကို ဖျက်ရန် သေချာပါသလား?`)) {
        const { error } = await window.sb.from('menu').delete().eq('id', id);
        if (!error) {
            alert("ဖျက်ပြီးပါပြီ။");
            loadMenuItems();
        }
    }
}

