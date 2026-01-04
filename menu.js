let editMode = false;
let currentEditingId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchMenuItems();
});

// ၁။ Menu Grid ဆွဲထုတ်ခြင်း
async function fetchMenuItems() {
    const grid = document.getElementById('menu-grid');
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

// ၂။ Add New Button နှိပ်လျှင် (Alert အစား Modal ဖွင့်ရန် ပြင်ဆင်သည်)
function enterAddMode() {
    currentEditingId = null; 
    toggleMenuOptions();
    
    // Form ထဲက Data တွေ အဟောင်းမကျန်အောင် အရင်ရှင်းသည်
    document.getElementById('modal-title').innerText = "Add New Item";
    document.getElementById('edit-name').value = "";
    document.getElementById('edit-price').value = "";
    document.getElementById('edit-stock').value = "0";
    document.getElementById('edit-available').checked = true;
    document.getElementById('preview-img').src = 'placeholder.jpg';
    
    document.getElementById('edit-modal').classList.remove('hidden');
}

// ၃။ Image Preview Function (ဒါက အစ်ကို့ Code မှာ ကျန်နေခဲ့တဲ့ Function ပါ)
function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        document.getElementById('preview-img').src = reader.result;
    };
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

// ၄။ Edit Modal ဖွင့်ခြင်း
async function openEditModal(id) {
    currentEditingId = id;
    const { data, error } = await supabase.from('menu').select('*').eq('id', id).single();
    
    if (data) {
        document.getElementById('modal-title').innerText = "Edit Menu Item";
        document.getElementById('edit-name').value = data.name;
        document.getElementById('edit-price').value = data.price;
        document.getElementById('edit-stock').value = data.stock_count;
        document.getElementById('edit-available').checked = data.is_available;
        document.getElementById('preview-img').src = data.image_url || 'placeholder.jpg';
        document.getElementById('edit-modal').classList.remove('hidden');
    }
}

// ၅။ Save Item Logic
async function saveItem() {
    const name = document.getElementById('edit-name').value;
    const price = document.getElementById('edit-price').value;
    const stock = document.getElementById('edit-stock').value;
    const available = document.getElementById('edit-available').checked;
    const fileInput = document.getElementById('file-input');

    if (!name || !price) return alert("အမည်နှင့် ဈေးနှုန်း ထည့်ပေးပါ");

    if (confirm("အချက်အလက်များကို သိမ်းဆည်းရန် သေချာပါသလား?") && confirm("အတည်ပြုပါသလား?")) {
        try {
            let imageUrl = document.getElementById('preview-img').src;

            // ပုံအသစ်ပါလျှင် အရင် Upload လုပ်သည်
            if (fileInput.files.length > 0) {
                imageUrl = await uploadImage(fileInput.files[0]);
            }

            const itemData = {
                name: name,
                price: parseFloat(price),
                stock_count: parseInt(stock),
                is_available: available,
                image_url: imageUrl
            };

            const { error } = currentEditingId 
                ? await supabase.from('menu').update(itemData).eq('id', currentEditingId)
                : await supabase.from('menu').insert([itemData]);

            if (error) throw error;

            alert("သိမ်းဆည်းအောင်မြင်ပါသည်။");
            closeModal();
            fetchMenuItems();
        } catch (err) {
            alert("Error: " + err.message);
        }
    }
}

// ၆။ အခြား လိုအပ်သော Function များ (Toggle/Close)
function toggleMenuOptions() {
    document.getElementById('option-overlay').classList.toggle('hidden');
}

function enterEditMode() {
    editMode = !editMode;
    toggleMenuOptions();
    fetchMenuItems(); 
}

async function handleItemClick(id) {
    if (!editMode) return;
    if (confirm("ပြင်ဆင်မှာ သေချာပါသလား?") && confirm("ထပ်မံအတည်ပြုပါ။")) {
        openEditModal(id); 
    }
}

function closeModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

