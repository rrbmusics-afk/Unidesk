/**
 * Aethercore Core Engine - Senior Build
 */

// 1. CONFIGURATION
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
const storage = firebase.storage();

let session = { user: '', role: 'member', roomId: '', code: '', uid: '' };

// 2. UI LOGIC (Switching, Locking, Validation)
const logic = {
    switchTab: (tab) => {
        document.querySelectorAll('.tab-trigger, .panel').forEach(el => el.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        document.getElementById(`panel-${tab}`).classList.add('active');
    },
    validate: () => {
        // Create Logic
        const aName = document.getElementById('admin-name').value.trim();
        const gName = document.getElementById('group-name').value.trim();
        document.getElementById('btn-create').disabled = !(aName && gName);

        // Join Logic
        const jName = document.getElementById('join-name').value.trim();
        const jCode = document.getElementById('join-code').value.trim();
        document.getElementById('btn-join').disabled = !(jName && jCode);
    },
    showInfo: () => document.getElementById('overlay-info').classList.add('active'),
    hideInfo: () => document.getElementById('overlay-info').classList.remove('active'),
    pickPhoto: () => document.getElementById('pfp-gate').click(),
    pickDocs: () => document.getElementById('doc-gate').click()
};

// Initialization of Listeners
document.querySelectorAll('input').forEach(i => i.addEventListener('input', logic.validate));

// 3. ENGINE OPERATIONS
const engine = {
    initRoom: async () => {
        const admin = document.getElementById('admin-name').value;
        const group = document.getElementById('group-name').value;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const ref = await db.collection('rooms').add({
            name: group,
            code: code,
            adminId: admin + Date.now(),
            photo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        session = { user: admin, role: 'admin', roomId: ref.id, code: code, uid: admin + Date.now() };
        engine.launch();
    },

    requestEntry: async () => {
        const name = document.getElementById('join-name').value;
        const code = document.getElementById('join-code').value.toUpperCase();

        const snap = await db.collection('rooms').where('code', '==', code).get();
        if(snap.empty) return alert("Access Denied: Room Code Invalid");

        const roomId = snap.docs[0].id;
        await db.collection('rooms').doc(roomId).collection('requests').add({
            name: name,
            uid: name + Date.now(),
            status: 'pending'
        });

        alert("Knock sent. Waiting for Admin approval...");
    },

    launch: () => {
        document.getElementById('view-auth').classList.remove('active');
        document.getElementById('view-hub').classList.add('active');
        
        document.getElementById('hub-title').innerText = session.name || "Aether Group";
        document.getElementById('hub-code-sub').innerText = "Code: " + session.code;
        document.getElementById('info-title').innerText = session.name || "Aether Group";
        document.getElementById('info-code').innerText = session.code;

        if(session.role === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
            engine.listenRequests();
        }
    },

    listenRequests: () => {
        db.collection('rooms').doc(session.roomId).collection('requests')
        .where('status', '==', 'pending')
        .onSnapshot(snap => {
            const banner = document.getElementById('approval-banner');
            document.getElementById('req-count').innerText = snap.size;
            banner.classList.toggle('hidden', snap.size === 0);
        });
    }
};

// 4. ANDROID SPECIAL: KEYBOARD FIX (Requirement 6)
const lockViewport = () => {
    const meta = document.querySelector('meta[name=viewport]');
    meta.setAttribute('content', meta.content + ', height=' + window.innerHeight);
};
window.addEventListener('load', lockViewport);

// WhatsApp style send button toggle
document.getElementById('msg-input').oninput = function() {
    const hasValue = this.value.trim().length > 0;
    document.getElementById('mic-btn').classList.toggle('hidden', hasValue);
    document.getElementById('send-btn').classList.toggle('hidden', !hasValue);
};
