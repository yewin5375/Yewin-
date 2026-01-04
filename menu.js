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

// ၇။ Edit Modal ဖွင့်ခြင်း (နောက်အဆင့်တွင် အသေးစိတ်ရေးမည်)
function openEditModal(id) {
    console.log("Editing Item ID:", id);
    // Modal UI logic ဤနေရာတွင် လာမည်
}

