// ၁။ Menu များကို ဆွဲထုတ်ပြသခြင်း
async function fetchMenu() {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;

    const { data: menuItems, error } = await supabase.from('menu').select('*').order('name');
    if (error) return;

    grid.innerHTML = menuItems.map(item => `
    <div class="menu-card ${item.stock < 5 ? 'low-stock' : ''}">
        <div class="menu-img-container">
            ${item.image_url 
                ? `<img src="${item.image_url}" alt="${item.name}">` 
                : `<i class="fas fa-utensils no-image"></i>`
            }
        </div>
        
        <div class="menu-details">
            <div class="menu-info">
                <h4>${item.name}</h4>
                <p class="price">${Number(item.price).toLocaleString()} K</p>
                <p class="cost">ရင်း: ${Number(item.cost_price || 0).toLocaleString()} K</p>
            </div>
            <div class="stock-info">
                လက်ကျန်: <strong>${item.stock}</strong>
            </div>
            <button class="edit-btn" onclick="openEditModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <i class="fas fa-edit"></i> ပြင်ဆင်ရန်
            </button>
        </div>
    </div>
`).join('');
    
    

// ၂။ Edit Modal ဖွင့်ခြင်း
function openEditModal(item) {
    document.getElementById('edit-modal').classList.remove('hidden');
    // Form ထဲသို့ data များဖြည့်ခြင်း
    document.getElementById('menuCost').value = item.cost_price;
    document.getElementById('menuPrice').value = item.price;
    document.getElementById('menuStock').value = item.stock;
    // item id ကို သိမ်းထားရန် (Update လုပ်ဖို့)
    window.currentEditingId = item.id;
}

// ၃။ ဒေတာ သိမ်းဆည်းခြင်း (Update)
async function saveItem() {
    const cost = document.getElementById('menuCost').value;
    const price = document.getElementById('menuPrice').value;
    const stock = document.getElementById('menuStock').value;

    const { error } = await supabase
        .from('menu')
        .update({ cost_price: cost, price: price, stock: stock })
        .eq('id', window.currentEditingId);

    if (!error) {
        alert("Menu Updated!");
        closeModal();
        fetchMenu();
        updateDashboardStats(); // app.js ထဲက function ကို ခေါ်ပြီး stats update လုပ်မယ်
    }
}
