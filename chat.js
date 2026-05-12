/** * Aethercore Professional Logic Hub
 * State-driven architecture to prevent misalignment.
 */

// UI Event Handlers
const ui = {
    tab: (type) => {
        // Toggle Active Tabs
        document.querySelectorAll('.tab-trigger, .panel').forEach(el => el.classList.remove('active'));
        document.getElementById(`t-${type}`).classList.add('active');
        document.getElementById(`p-${type}`).classList.add('active');
    },

    validate: () => {
        // 1. Check Create Room validation
        const aName = document.getElementById('admin-name').value.trim();
        const gName = document.getElementById('group-name').value.trim();
        document.getElementById('btn-create').disabled = !(aName.length > 2 && gName.length > 2);

        // 2. Check Join Room validation
        const uName = document.getElementById('user-name').value.trim();
        const rCode = document.getElementById('room-code').value.trim();
        document.getElementById('btn-join').disabled = !(uName.length > 2 && rCode.length === 6);
    }
};

// Real-time Input Monitoring
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', ui.validate);
});

// Initialization Logic
const core = {
    initRoom: () => {
        console.log("Initializing E2EE Infrastructure...");
        // Room Creation Logic here
    },
    requestEntry: () => {
        console.log("Sending Knock Request...");
        // Join Request Logic here
    }
};
