let editMode = false;
let currentEditingId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchMenuItems();
});

// ၁။ ရိုးရိုး Menu Grid ပြသခြင်း
async function fetchMenuItems() {
    editMode = false; // ရိုးရိုး mode သို့ ပြန်ပြောင်း
    const grid = document.getElementById('menu-grid');
    if(!grid) return;
    grid.innerHTML = '<div class="loading">Loading Menu...</div>';

    const { data, error } = await supabase.from('menu').select('*').order('name', { ascending: true });
    
    if (error) {
        grid.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        return;
    }

    grid.innerHTML = data.map(item => `
        <div class="menu-card">
            <div class="image-container">
                <img src="${item.image_url || 'placeholder.jpg'}" alt="${item.name}">
                ${!item.is_available ? '<div class="sold-out-overlay">Sold Out</div>' : ''}
            </div>
            <div class="item-info">
                <h4 class="item-name">${item.name}</h4>
                <p class="item-price">${item.price.toLocaleString()} MMK</p>
                <p style="font-size: 11px; color: #888;">Stock: ${item.stock || 0}</p>
            </div>
        </div>
    `).join('');
}

// ၂။ Edit Mode (ပြင်ဆင်သည့်စနစ်) သို့ ဝင်ခြင်း
function enterEditMode() {
    editMode = true;
    document.getElementById('edit-mode-btn').classList.add('hidden');
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    toggleMenuOptions();
    renderMenuWithControls(); 
}

// ၃။ Edit/Delete ခလုတ်များပါသော Menu ကို ပြသခြင်း
async function renderMenuWithControls() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '<div class="loading">Loading Edit Mode...</div>';

    const { data, error } = await supabase.from('menu').select('*').order('name', { ascending: true });
    if (error) return console.error(error);

    grid.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card edit-active'; 
        
        // Card ကို နှိပ်လျှင် Edit Modal ပွင့်မည်
        card.onclick = () => openEditModal(item);

        card.innerHTML = `
            <div class="image-container">
                <img src="${item.image_url || 'placeholder.jpg'}">
                <button class="delete-badge" onclick="event.stopPropagation(); deleteItem('${item.id}', '${item.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">${item.price.toLocaleString()} MMK</div>
                <div style="color:var(--primary-accent); font-size:12px; margin-top:5px;">
                    <i class="fas fa-pen"></i> Tap to Edit
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ၄။ Edit Modal ဖွင့်ခြင်း
function openEditModal(item) {
    currentEditingId = item.id;
    document.getElementById('modal-title').innerText = "Edit Item";
    document.getElementById('edit-name').value = item.name;
    document.getElementById('edit-price').value = item.price;
    document.getElementById('edit-stock').value = item.stock || 0;
    document.getElementById('edit-available').checked = item.is_available;
    document.getElementById('preview-img').src = item.image_url || 'placeholder.jpg';
    
    document.getElementById('edit-modal').classList.remove('hidden');
}

// ၅။ Edit Mode မှ ပြန်ထွက်ခြင်း
function exitEditMode() {
    editMode = false;
    document.getElementById('edit-mode-btn').classList.remove('hidden');
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    fetchMenuItems(); 
}

// ၆။ Item အသစ်ထည့်ရန် Modal ဖွင့်ခြင်း
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

// ၇။ Item သိမ်းဆည်းခြင်း (Insert & Update)
async function saveItem() {
    const name = document.getElementById('edit-name').value;
    const price = document.getElementById('edit-price').value;
    const stockVal = document.getElementById('edit-stock').value;
    const available = document.getElementById('edit-available').checked;
    const fileInput = document.getElementById('file-input');

    if (!name || !price) return alert("အမည်နှင့် ဈေးနှုန်း ထည့်ပေးပါ");

    try {
        let imageUrl = document.getElementById('preview-img').src;

        if (fileInput.files && fileInput.files.length > 0) {
            imageUrl = await uploadImage(fileInput.files[0]);
        }

        const itemData = {
            name: name,
            price: parseFloat(price),
            stock: parseInt(stockVal) || 0,
            stock_count: parseInt(stockVal) || 0,
            is_available: available,
            image_url: imageUrl
        };

        const { error } = currentEditingId 
            ? await supabase.from('menu').update(itemData).eq('id', currentEditingId)
            : await supabase.from('menu').insert([itemData]);

        if (error) throw error;

        alert("အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။");
        closeModal();
        editMode ? renderMenuWithControls() : fetchMenuItems();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ၈။ Item ဖျက်ခြင်း
async function deleteItem(id, name) {
    if (confirm(`"${name}" ကို ဖျက်ပစ်မှာ သေချာပါသလား?`)) {
        const { error } = await supabase.from('menu').delete().eq('id', id);
        if (!error) {
            renderMenuWithControls();
        } else {
            alert("Error: " + error.message);
        }
    }
}

// ၉။ Helper Functions
function toggleMenuOptions() {
    document.getElementById('option-overlay').classList.toggle('hidden');
}

function closeModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    currentEditingId = null;
}

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = () => document.getElementById('preview-img').src = reader.result;
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

// Image Upload Logic
async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `menu-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('menu_images')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('menu_images').getPublicUrl(filePath);
    return data.publicUrl;
}
