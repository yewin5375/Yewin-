let isEditMode = false;
let currentEditingItemId = null;

// စတင်ချိန်တွင် Menu များကို ဆွဲထုတ်ရန်
document.addEventListener('DOMContentLoaded', () => {
    fetchMenuItems();
});

// ၁။ Menu List ကို ဆွဲထုတ်ပြသခြင်း (Normal & Edit Mode နှစ်ခုလုံးအတွက်)
async function fetchMenuItems() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    // Loading ပြရန်
    grid.innerHTML = '<div class="loading">Loading Menu...</div>';

    const { data, error } = await supabase
        .from('menu')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        grid.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        return;
    }

    grid.innerHTML = data.map(item => `
        <div class="menu-card ${isEditMode ? 'edit-shake' : ''}" 
             onclick="${isEditMode ? `openEditModal(${JSON.stringify(item).replace(/"/g, '&quot;')})` : ''}">
            
            ${isEditMode ? `
                <button class="delete-badge" onclick="deleteItem(event, '${item.id}', '${item.name}')">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="edit-badge"><i class="fas fa-pen"></i></div>
            ` : ''}

            <div class="image-container">
                <img src="${item.image_url || 'placeholder.jpg'}" alt="${item.name}">
                ${(!item.is_available || item.stock <= 0) ? '<div class="sold-out-overlay">SOLD OUT</div>' : ''}
            </div>

            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">${Number(item.price).toLocaleString()} K</div>
                <p style="font-size: 11px; color: #888; margin-top: 4px;">Stock: ${item.stock || 0}</p>
                
                ${isEditMode ? `
                    <div style="color:var(--primary-accent); font-size:12px; margin-top:5px;">
                        <i class="fas fa-magic"></i> Tap to Edit
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ၂။ Edit Mode ကို အဖွင့်/အပိတ် လုပ်ခြင်း
function toggleEditMode() {
    isEditMode = !isEditMode;
    
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const optionCard = document.getElementById('option-overlay');

    if (isEditMode) {
        cancelBtn?.classList.remove('hidden');
        optionCard?.classList.add('hidden'); // Menu Option ကို ပိတ်လိုက်မည်
    } else {
        cancelBtn?.classList.add('hidden');
    }

    fetchMenuItems(); // UI ကို Refresh လုပ်ခြင်း
}

// ၃။ Edit Modal ဖွင့်ခြင်း (ပြင်ဆင်ရန်)
function openEditModal(item) {
    currentEditingItemId = item.id;
    document.getElementById('modal-title').innerText = "Edit Item";
    document.getElementById('edit-name').value = item.name;
    document.getElementById('edit-price').value = item.price;
    document.getElementById('edit-stock').value = item.stock || 0;
    
    // Checkbox ရှိလျှင် (is_available)
    const availCheck = document.getElementById('edit-available');
    if(availCheck) availCheck.checked = item.is_available;

    document.getElementById('preview-img').src = item.image_url || 'placeholder.jpg';
    document.getElementById('edit-modal').classList.remove('hidden');
}

// ၄။ Add Modal ဖွင့်ခြင်း (အသစ်ထည့်ရန်)
function openAddModal() {
    currentEditingItemId = null; 
    document.getElementById('modal-title').innerText = "Add New Item";
    document.getElementById('edit-name').value = "";
    document.getElementById('edit-price').value = "";
    document.getElementById('edit-stock').value = "0";
    
    const availCheck = document.getElementById('edit-available');
    if(availCheck) availCheck.checked = true;

    document.getElementById('preview-img').src = 'placeholder.jpg';
    document.getElementById('edit-modal').classList.remove('hidden');
    document.getElementById('option-overlay').classList.add('hidden');
}

// ၅။ Item သိမ်းဆည်းခြင်း (Insert & Update)
async function saveItem() {
    const name = document.getElementById('edit-name').value;
    const price = document.getElementById('edit-price').value;
    const stockVal = document.getElementById('edit-stock').value;
    const availCheck = document.getElementById('edit-available');
    const fileInput = document.getElementById('file-input');

    if (!name || !price) return alert("အမည်နှင့် ဈေးနှုန်း ထည့်ပေးပါ");

    try {
        let imageUrl = document.getElementById('preview-img').src;

        // ပုံအသစ်ရွေးထားလျှင် Storage သို့ Upload တင်မည်
        if (fileInput && fileInput.files.length > 0) {
            imageUrl = await uploadImage(fileInput.files[0]);
        }

        const itemData = {
            name: name,
            price: parseFloat(price),
            stock: parseInt(stockVal) || 0,
            is_available: availCheck ? availCheck.checked : true,
            image_url: imageUrl
        };

        const { error } = currentEditingItemId 
            ? await supabase.from('menu').update(itemData).eq('id', currentEditingItemId)
            : await supabase.from('menu').insert([itemData]);

        if (error) throw error;

        alert("အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။");
        closeModal();
        fetchMenuItems(); // List ကို ပြန်ပြောင်းမည်

    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ၆။ Image Upload Logic (Supabase Storage)
async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`; // Bucket ထဲသို့ တိုက်ရိုက်တင်ခြင်း

    const { error: uploadError } = await supabase.storage
        .from('menu_images')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('menu_images').getPublicUrl(filePath);
    return data.publicUrl;
}

// ၇။ Item ဖျက်ခြင်း
async function deleteItem(event, id, name) {
    event.stopPropagation(); // Card Click ပွင့်မလာစေရန်
    if (confirm(`"${name}" ကို ဖျက်ပစ်မှာ သေჩာပါသလား?`)) {
        const { error } = await supabase.from('menu').delete().eq('id', id);
        if (!error) {
            fetchMenuItems();
        } else {
            alert("Error: " + error.message);
        }
    }
}

// ၈။ UI Helper Functions
function closeModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    currentEditingItemId = null;
    if(document.getElementById('file-input')) document.getElementById('file-input').value = "";
}

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = () => document.getElementById('preview-img').src = reader.result;
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function toggleMenuOptions() {
    const overlay = document.getElementById('option-overlay');
    if(overlay) overlay.classList.toggle('hidden');
}
