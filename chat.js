// Tab Switching Logic
function switchTab(tabType) {
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.toLowerCase().includes(tabType)) btn.classList.add('active');
    });

    // Forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${tabType}-form`).classList.add('active');
}

// Validation Logic: Unlocks buttons only when inputs are filled
const forms = ['create-form', 'join-form'];
forms.forEach(formId => {
    const form = document.getElementById(formId);
    const btn = form.querySelector('.primary-btn');
    const inputs = form.querySelectorAll('input');

    form.addEventListener('input', () => {
        let allFilled = true;
        inputs.forEach(input => {
            if (input.value.trim() === "") allFilled = false;
        });
        btn.disabled = !allFilled;
    });
});

// Admin Profile Photo (1:1 Ratio Check)
function validateImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            if (img.width === img.height) resolve(true);
            else {
                alert("Please upload a square (1:1) image, similar to WhatsApp.");
                resolve(false);
            }
        };
        img.src = URL.createObjectURL(file);
    });
}
