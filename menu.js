let editMode = false;
let currentEditingId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchMenuItems();
});

// ၁။ Menu Grid ဆွဲထုတ်ခြင်း
async function fetchMenuItems() {
    const grid = document.getElementById('menu-grid');
    if(!grid) return;
    grid.innerHTML = '<div class="loading">Loading Menu...</div>';

    const { data, error } = await supabase.from('menu').select('*').order('name', { ascending: true });
    
    if (error) {
        grid.innerHTML = '<p class="error">Error loading data.</p>';
        return;
    }

    grid.innerHTML = data.map(item => `
        <div class="menu-card ${editMode ? 'edit-active' : ''}" onclick="handleItemClick('${item.id}')">
            <div class="image-container">
                <img src="${item.image_url || 'placeholder.jpg'}" alt="${item.name}">
                ${!item.is_available ? '<div class="sold-out-overlay">Sold Out</div>' : ''}
            </div>
            <div class="item-info">
                <h4 class="item-name">${item.name}</h4>
                <p class="item-price">${item.price.toLocaleString()} MMK</p>
            </div>
            ${editMode ? '<div class="edit-badge"><i class="fas fa-pen"></i></div>' : ''}
        </div>
    `).join('');
}

// ၂။ ပုံတင်သည့် function (Upsert ပါဝင်ပြီးသား)
async function uploadImage(file) {
    try {
        // ၁။ supabase object ရှိမရှိ အရင်စစ်ပါ
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase is not initialized. Check your supabase.js file.');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `menu-images/${fileName}`;

        // ၂။ Bucket နာမည် 'images' ဟုတ်မဟုတ် Supabase Dashboard မှာ ပြန်စစ်ပေးပါ
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('menu_images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true 
            });

        if (uploadError) throw uploadError;

        // ၃။ Public URL ကို ဆွဲထုတ်ခြင်း
        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        
        if (!data || !data.publicUrl) {
            throw new Error('Could not get public URL');
        }

        return data.publicUrl;
    } catch (err) {
        console.error('Full Upload Error:', err);
        throw err;
    }
}

// ၃။ Save Item Logic (Database Column နှစ်ခုလုံးအတွက်)
async function saveItem() {
    const name = document.getElementById('edit-name').value;
    const price = document.getElementById('edit-price').value;
    const stockVal = document.getElementById('edit-stock').value;
    const available = document.getElementById('edit-available').checked;
    const fileInput = document.getElementById('file-input');

    if (!name || !price) return alert("အမည်နှင့် ဈေးနှုန်း ထည့်ပေးပါ");

    try {
        let imageUrl = document.getElementById('preview-img').src;

        // ပုံအသစ်ပါလျှင် upload လုပ်မည်
        if (fileInput.files && fileInput.files.length > 0) {
            imageUrl = await uploadImage(fileInput.files[0]);
        }

        const itemData = {
            name: name,
            price: parseFloat(price),
            stock: parseInt(stockVal) || 0,        // 'stock' column
            stock_count: parseInt(stockVal) || 0,  // 'stock_count' column
            is_available: available,
            image_url: imageUrl
        };

        const { error } = currentEditingId 
            ? await supabase.from('menu').update(itemData).eq('id', currentEditingId)
            : await supabase.from('menu').insert([itemData]);

        if (error) throw error;

        alert("အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။");
        closeModal();
        fetchMenuItems();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ၄။ Helper Functions
function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        document.getElementById('preview-img').src = reader.result;
    };
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function enterAddMode() {
    currentEditingId = null; 
    document.getElementById('modal-title').innerText = "Add New Item";
    document.getElementById('edit-name').value = "";
    document.getElementById('edit-price').value = "";
    document.getElementById('edit-stock').value = "0";
    document.getElementById('edit-available').checked = true;
    document.getElementById('preview-img').src = 'placeholder.jpg';
    document.getElementById('edit-modal').classList.remove('hidden');
    toggleMenuOptions();
}

async function openEditModal(id) {
    currentEditingId = id;
    const { data, error } = await supabase.from('menu').select('*').eq('id', id).single();
    if (data) {
        document.getElementById('modal-title').innerText = "Edit Menu Item";
        document.getElementById('edit-name').value = data.name;
        document.getElementById('edit-price').value = data.price;
        // အစ်ကို့ table မှာ stock လို့ ပေးထားရင် data.stock လို့ ပြင်သုံးပါ
        document.getElementById('edit-stock').value = data.stock || data.stock_count || 0;
        document.getElementById('edit-available').checked = data.is_available;
        document.getElementById('preview-img').src = data.image_url || 'placeholder.jpg';
        document.getElementById('edit-modal').classList.remove('hidden');
    }
}

function toggleMenuOptions() {
    document.getElementById('option-overlay').classList.toggle('hidden');
}

function enterEditMode() {
    editMode = !editMode;
    toggleMenuOptions();
    fetchMenuItems(); 
}

function handleItemClick(id) {
    if (!editMode) return;
    openEditModal(id);
}

function closeModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

// --- Edit Mode ထဲသို့ ဝင်ခြင်း ---
function enterEditMode() {
    document.getElementById('menu-grid').classList.add('edit-mode-active');
    document.getElementById('edit-mode-btn').classList.add('hidden'); // Edit ခလုတ်ကို ဖျောက်
    document.getElementById('cancel-edit-btn').classList.remove('hidden'); // Cancel ခလုတ်ကို ပြ
    toggleMenuOptions(); // Option menu ကို ပိတ်
    renderMenuWithControls(); // Delete ခလုတ်တွေ ပါတဲ့ list ကို ပြန်ဆွဲ
}

// --- Edit Mode မှ ပြန်ထွက်ခြင်း ---
function exitEditMode() {
    document.getElementById('menu-grid').classList.remove('edit-mode-active');
    document.getElementById('edit-mode-btn').classList.remove('hidden');
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    fetchMenuItems(); // ရိုးရိုး menu list ကို ပြန်ပြ
}

// --- Delete ခလုတ်ပါဝင်သော Menu ကို ဆွဲထုတ်ခြင်း ---
async function renderMenuWithControls() {
    const { data } = await supabase.from('menu').select('*');
    const grid = document.getElementById('menu-grid');
    
    grid.innerHTML = data.map(item => `
        <div class="menu-card edit-shake" onclick='openEditModal(${JSON.stringify(item)})'>
            <div class="image-container">
                <img src="${item.image_url || 'placeholder.jpg'}">
                <button class="delete-badge" onclick="event.stopPropagation(); deleteItem('${item.id}', '${item.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">${item.price} MMK</div>
            </div>
            <div style="text-align:center; padding-bottom:10px; color:var(--primary-accent); font-size:12px;">
                <i class="fas fa-pen"></i> Tap to Edit
            </div>
        </div>
    `).join('');
}
// --- Item ကို ဖျက်ခြင်း (Delete Function) ---
async function deleteItem(id, name) {
    if (confirm(`"${name}" ကို မီနူးထဲကနေ ဖျက်ပစ်မှာ သေချာပါသလား?`)) {
        const { error } = await supabase.from('menu').delete().eq('id', id);
        if (!error) {
            alert("ဖျက်ပြီးပါပြီ။");
            renderMenuWithControls(); // List ကို ပြန် update လုပ်
        } else {
            alert("Error: " + error.message);
        }
    }
}
