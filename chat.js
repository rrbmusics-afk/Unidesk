// Firebase Config (Provided by you)
const firebaseConfig = {
    apiKey: "AIzaSyDbfmd0zmv_mFV0CG2OrhKPPeU3zPYGOBg",
    authDomain: "unidesk-a70ac.firebaseapp.com",
    projectId: "unidesk-a70ac",
    storageBucket: "unidesk-a70ac.firebasestorage.app",
    messagingSenderId: "882535016432",
    appId: "1:882535016432:web:6eca2645a47a827e779f35"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 1. UI LOGIC
const ui = {
    toggleTab: (type) => {
        document.querySelectorAll('.t-btn, .tab-panel').forEach(el => el.classList.remove('active'));
        document.getElementById(`t-${type}`).classList.add('active');
        document.getElementById(`f-${type}`).classList.add('active');
    },
    validate: () => {
        // Create Validation
        const cName = document.getElementById('in-admin-name').value;
        const gName = document.getElementById('in-group-name').value;
        document.getElementById('btn-create').disabled = !(cName && gName);

        // Join Validation
        const uName = document.getElementById('in-user-name').value;
        const uCode = document.getElementById('in-code').value;
        document.getElementById('btn-join').disabled = !(uName && uCode);
    }
};

// Listen for inputs to unlock buttons
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', ui.validate);
});

// 2. CORE FIREBASE LOGIC
const core = {
    createRoom: async () => {
        const admin = document.getElementById('in-admin-name').value;
        const group = document.getElementById('in-group-name').value;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const ref = await db.collection('rooms').add({
            name: group,
            code: code,
            admin: admin,
            photo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        });

        core.launch(group, code, 'admin');
    },
    launch: (name, code, role) => {
        document.getElementById('screen-auth').classList.remove('active');
        document.getElementById('screen-chat').classList.add('active');
        document.getElementById('h-title').innerText = name;
        document.getElementById('h-code').innerText = "Code: " + code;
    }
};

// Android Keyboard Fix
window.addEventListener('resize', () => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        document.activeElement.scrollIntoView({ block: "center" });
    }
});
