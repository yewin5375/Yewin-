let editMode = false;

// ၁။ စာမျက်နှာစဖွင့်သည်နှင့် Menu များကို ဆွဲထုတ်ပြသခြင်း
document.addEventListener('DOMContentLoaded', () => {
    fetchMenuItems();
});

// ၂။ Menu ဒေတာများကို Grid ၂ ခုတွဲဖြင့် ဆွဲထုတ်ခြင်း
async function fetchMenuItems() {
    const grid = document.getElementById('menu-grid');
    
    // Loading ပြရန် (Pearl White Style)
    grid.innerHTML = '<div class="loading">Loading Menu...</div>';

    const { data, error } = await supabase.from('menu').select('*').order('name', { ascending: true });
    
    if (error) {
        console.error('Error fetching menu:', error);
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
                ${item.stock_count <= 5 && item.is_available ? `<span class="low-stock">Low Stock: ${item.stock_count}</span>` : ''}
            </div>
            ${editMode ? '<div class="edit-badge"><i class="fas fa-pen"></i></div>' : ''}
        </div>
    `).join('');
}

// ၃။ Edit Mode ကို ဖွင့်/ပိတ်ခြင်း (Option ခလုတ်အတွက်)
function toggleMenuOptions() {
    const overlay = document.getElementById('option-overlay');
    overlay.classList.toggle('hidden');
    // အပြင်ကိုနှိပ်ရင် ပိတ်သွားစေရန်
    if (!overlay.classList.contains('hidden')) {
        overlay.classList.add('animate-fadeIn');
    }
}

// ၄။ Edit Mode ထဲသို့ဝင်ခြင်း
function enterEditMode() {
    editMode = !editMode;
    toggleMenuOptions(); // Option Menu ကိုပြန်ပိတ်ရန်
    
    // UI Update လုပ်ရန်
    const grid = document.getElementById('menu-grid');
    if (editMode) {
        grid.classList.add('editing-visual');
    } else {
        grid.classList.remove('editing-visual');
    }
    
    fetchMenuItems(); 
}

// ၅။ Item တစ်ခုချင်းစီကို နှိပ်လျှင် လုပ်ဆောင်မည့် Logic
async function handleItemClick(id) {
    if (!editMode) return;

    // အဆင့် ၁: ပထမအကြိမ်မေးခြင်း
    const firstCheck = confirm("ဒီ Menu ကို ပြင်ဆင်မှာ သေချာပါသလား?");
    if (firstCheck) {
        // အဆင့် ၂: ဒုတိယအကြိမ်မေးခြင်း (Safety Confirmation)
        const secondCheck = confirm("သေချာပါတယ်နော်? အမှားမရှိအောင် ထပ်မံအတည်ပြုပေးပါ။");
        if (secondCheck) {
            openEditModal(id); 
        }
    }
}

// ၆။ Add New Item Logic
function enterAddMode() {
    toggleMenuOptions();
    // ဤနေရာတွင် Add New Modal ကို ခေါ်ပေးရမည်
    alert("Add New Item Form ကို ဖွင့်ပါမည်။");
}

let currentEditingId = null;

// Modal ဖွင့်ခြင်း
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

// ဓာတ်ပုံတင်ခြင်း (Supabase Storage သို့)
async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `menu-images/${fileName}`;

    let { error: uploadError } = await supabase.storage
        .from('images') // Supabase မှာ 'images' ဆိုတဲ့ Bucket ရှိရပါမယ်
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
}

// ဒေတာသိမ်းဆည်းခြင်း (Add/Edit နှစ်မျိုးလုံးအတွက်)
async function saveItem() {
    const name = document.getElementById('edit-name').value;
    const price = document.getElementById('edit-price').value;
    const stock = document.getElementById('edit-stock').value;
    const available = document.getElementById('edit-available').checked;
    const fileInput = document.getElementById('file-input');

    if (!name || !price) return alert("အမည်နှင့် ဈေးနှုန်း ထည့်ပေးပါ");

    const firstCheck = confirm("အချက်အလက်များကို သိမ်းဆည်းရန် သေချာပါသလား?");
    if (firstCheck && confirm("ဒေတာများ မှန်ကန်ကြောင်း ထပ်မံအတည်ပြုပါ။")) {
        
        try {
            let imageUrl = document.getElementById('preview-img').src;

            // ပုံအသစ်ရွေးထားရင် အရင်တင်မယ်
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

            if (currentEditingId) {
                // Edit လုပ်ခြင်း
                const { error } = await supabase.from('menu').update(itemData).eq('id', currentEditingId);
                if (error) throw error;
            } else {
                // Add New လုပ်ခြင်း
                const { error } = await supabase.from('menu').insert([itemData]);
                if (error) throw error;
            }

            alert("သိမ်းဆည်းအောင်မြင်ပါသည်။");
            closeModal();
            fetchMenuItems(); // Grid ကို refresh လုပ်မယ်
        } catch (err) {
            alert("Error: " + err.message);
        }
    }
}


function closeModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}


