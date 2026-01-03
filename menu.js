async function handleMenuUpload() {
    const file = document.getElementById('itemImage').files[0];
    const name = document.getElementById('itemName').value;
    const price = document.getElementById('itemPrice').value;
    const category = document.getElementById('itemCategory').value;
    const btn = document.getElementById('uploadBtn');

    if (!file || !name || !price) return alert("Please fill all fields!");

    btn.innerText = "Uploading...";
    btn.disabled = true;

    try {
        // ၁. ပုံကို Supabase Storage (menu-images bucket) ထဲ တင်ခြင်း
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await window.sb.storage
            .from('menu-images')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // ၂. တင်လိုက်တဲ့ ပုံရဲ့ Public URL ယူခြင်း
        const { data: urlData } = window.sb.storage
            .from('menu-images')
            .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;

        // ၃. Database ထဲ အချက်အလက် သိမ်းခြင်း
        const { error: dbError } = await window.sb.from('menu').insert([
            { name, price, category, image_url: imageUrl }
        ]);

        if (dbError) throw dbError;

        alert("Menu added successfully!");
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        loadMenuItems();
    } catch (e) {
        console.error(e);
        alert("Error: " + e.message);
    } finally {
        btn.innerText = "Add New Menu";
        btn.disabled = false;
    }
}

async function loadMenuItems() {
    const { data, error } = await window.sb.from('menu').select('*').order('created_at', { ascending: false });
    const listDiv = document.getElementById('menu-list');
    if (!error) {
        listDiv.innerHTML = data.map(item => `
            <div class="stat-card">
                <img src="${item.image_url}" style="width:100%; height:100px; object-fit:cover; border-radius:8px;">
                <h4>${item.name}</h4>
                <p>${item.price} Ks</p>
                <button onclick="toggleAvailability(${item.id}, ${!item.is_available})" 
                    style="background:${item.is_available ? '#28a745' : '#777'}">
                    ${item.is_available ? 'In Stock' : 'Out of Stock'}
                </button>
            </div>
        `).join('');
    }
}

async function toggleAvailability(id, status) {
    await window.sb.from('menu').update({ is_available: status }).eq('id', id);
    loadMenuItems();
}
