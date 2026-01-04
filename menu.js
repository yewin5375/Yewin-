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

// ၂။ ပုံတင်သည့် function (နာမည်ကို သေချာစစ်ပါ)
async function uploadImage(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `menu-images/${fileName}`;

        // Bucket နာမည် 'images' ဖြစ်ကြောင်း သေချာပါစေ
        let { error: uploadError } = await supabase.storage
            .from('images') 
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (err) {
        console.error('Upload error:', err);
        throw new Error('Image upload failed');
    }
}

// ၃။ Save Item Logic
async function saveItem() {
    const name = document.getElementById('edit-name').value;
    const price = document.getElementById('edit-price').value;
    const stock = document.getElementById('edit-stock').value;
    const available = document.getElementById('edit-available').checked;
    const fileInput = document.getElementById('file-input');

    if (!name || !price) return alert("အမည်နှင့် ဈေးနှုန်း ထည့်ပေးပါ");

    if (confirm("အချက်အလက်များကို သိမ်းဆည်းရန် သေချာပါသလား?")) {
        try {
            let imageUrl = document.getElementById('preview-img').src;

            // ပုံအသစ်ပါလျှင် uploadImage ကိုခေါ်မည်
            if (fileInput.files && fileInput.files.length > 0) {
                imageUrl = await uploadImage(fileInput.files[0]);
            }

               // menu.js ထဲက saveItem function အပိုင်း
const itemData = {
    name: name,
    price: parseFloat(price),
    stock: parseInt(stock), // အစ်ကို့ table ထဲက 'stock' column အတွက်
    stock_count: parseInt(stock), // 'stock_count' အတွက်ပါ တစ်ခါတည်းထည့်ပေးထားပါတယ်
    is_available: available,
    image_url: imageUrl
};

             ;

            const { error } = currentEditingId 
                ? await supabase.from('menu').update(itemData).eq('id', currentEditingId)
                : await supabase.from('menu').insert([itemData]);

            if (error) throw error;

            alert("Success!");
            closeModal();
            fetchMenuItems();
        } catch (err) {
            alert("Error: " + err.message);
        }
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
; 
 toggleMenuOptions()s(    document.getElementById('modal-title').innerText = "Add New Item";
    document.getElementById('edit-name').value = "";
    document.getElementById('edit-price').value = "";
    document.getElementById('preview-img').src = 'placeholder.jpg';
    document.getElementById('edit-modal').classList.remove('hidden');
}

async function openEditModal(id) {
    currentEditingId = id;
    const { data } = await supabase.from('menu').select('*').eq('id', id).single();
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

// menu.js ထဲက uploadImage အပိုင်း
let { error: uploadError } = await supabase.storage
    .from('images') 
    .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // ဒါလေး ထည့်လိုက်ပါ (ရှိပြီးသားပုံဆိုရင် အစားထိုးဖို့)
    });
