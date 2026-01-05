// Edit Mode ကို ဖွင့်ပေးတဲ့ function
function enterEditMode() {
    editMode = true; // variable နာမည် မှန်အောင်စစ်ပါ
    const grid = document.getElementById('menu-grid');
    grid.classList.add('edit-mode-active'); // shake ဖြစ်ဖို့ CSS class ထည့်တာ
    
    // ခလုတ်တွေကို update လုပ်မယ်
    document.getElementById('edit-mode-btn').classList.add('hidden');
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    
    renderMenuWithControls(); // edit badge တွေပါတဲ့ grid ကို ပြန်ဆွဲတာ
}
