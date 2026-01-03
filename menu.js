// ၁။ Menu များကို Database မှ ဆွဲထုတ်ပြသခြင်း
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
            listDiv.innerHTML = "<p style='padding:20px;'>No menu items found. Add one above!</p>";
            return;
        }

        listDiv.innerHTML = data.map(item => `
            <div class="stat-card" style="position:relative;">
                <img src="${item.image_url || 'https://via.placeholder.com/150'}" 
                     style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:10px;">
                <h4 style="margin:5px 0;">${item.name}</h4>
                <p style="color:#e67e22; font-weight:bold; margin:5px 0;">${Number(item.price).toLocaleString()} Ks</p>
                <div style="display:flex; gap:5px;">
                    <button onclick="toggleAvailability(${item.id}, ${!item.is_available})" 
                        style="flex:1; font-size:12px; background:${item.is_available ? '#28a745' : '#777'}">
                        ${item.is_available ? 'In Stock' : 'Out of Stock'}
                    </button>
                    <button onclick="deleteMenuItem(${item.id})" 
                        style="background:#dc3545; padding:5px 10px;">🗑</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Menu Load Error:", e.message);
    }
}

// ၂။ Menu အသစ်တင်ခြင်း (Image Upload အပါအဝင်)
async function handleMenuUpload() {
    const file = document.getElementById('itemImage').files[0];
    const name = document.getElementById('itemName').value;
    const price = document.getElementById('itemPrice').value;
    const category = document.getElementById('itemCategory').value;
    const btn = document.getElementById('uploadBtn');

    if (!file || !name || !price) return alert("ကျေးဇူးပြု၍ အချက်အလက်စုံအောင်ဖြည့်ပါ!");

    btn.innerText = "Uploading...";
    btn.disabled = true;

    try {
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await window.sb.storage
            .from('menu-images')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = window.sb.storage
            .from('menu-images')
            .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;

        const { error: dbError } = await window.sb.from('menu').insert([
            { name, price: Number(price), category, image_url: imageUrl }
        ]);

        if (dbError) throw dbError;

        alert("Menu အသစ်ထည့်သွင်းပြီးပါပြီ!");
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemImage').value = '';
        loadMenuItems();
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        btn.innerText = "Add New Menu";
        btn.disabled = false;
    }
}

// ၃။ ပစ္စည်းရှိ/မရှိ အဖွင့်အပိတ်လုပ်ခြင်း
async function toggleAvailability(id, status) {
    const { error } = await window.sb.from('menu').update({ is_available: status }).eq('id', id);
    if (!error) loadMenuItems();
}

// ၄။ Menu ဖျက်ခြင်း
async function deleteMenuItem(id) {
    if (confirm("ဒီ Menu ကို ဖျက်မှာ သေချာပါသလား?")) {
        const { error } = await window.sb.from('menu').delete().eq('id', id);
        if (!error) loadMenuItems();
    }
}

