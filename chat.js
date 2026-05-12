// 1. CONFIG
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

let session = { user: '', room: '', code: '' };

// 2. UI LOGIC
const ui = {
    tab: (t) => {
        document.querySelectorAll('.tab-btn, .panel').forEach(el => el.classList.remove('active'));
        document.getElementById(`t-${t}`).classList.add('active');
        document.getElementById(`panel-${t}`).classList.add('active');
    },
    check: () => {
        // Unlock logic
        const a = document.getElementById('in-admin').value;
        const g = document.getElementById('in-group').value;
        document.getElementById('btn-create').disabled = !(a && g);

        const u = document.getElementById('in-user').value;
        const c = document.getElementById('in-code').value;
        document.getElementById('btn-join').disabled = !(u && c);
    },
    toggleSend: () => {
        const val = document.getElementById('msg-input').value.trim().length > 0;
        document.getElementById('mic-btn').classList.toggle('hidden', val);
        document.getElementById('send-btn').classList.toggle('hidden', !val);
    }
};

// 3. CORE FIREBASE
const core = {
    create: async () => {
        const admin = document.getElementById('in-admin').value;
        const group = document.getElementById('in-group').value;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const ref = await db.collection('rooms').add({ name: group, code: code, admin: admin });
        session = { user: admin, room: ref.id, code: code, name: group };
        core.launch();
    },
    launch: () => {
        document.getElementById('view-auth').classList.remove('active');
        document.getElementById('view-chat').classList.add('active');
        document.getElementById('h-name').innerText = session.name;
        document.getElementById('h-code').innerText = "Code: " + session.code;
    }
};
