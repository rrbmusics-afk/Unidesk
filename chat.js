// --- CONFIGURATION ---
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

let user = { name: '', role: 'member', roomId: '', uid: '' };
let mediaRecorder;
let audioChunks = [];

// --- UI CONTROLLER ---
const ui = {
    switchTab: (tab) => {
        document.querySelectorAll('.tab-btn, .auth-form').forEach(el => el.classList.remove('active'));
        document.getElementById(`t-${tab}`).classList.add('active');
        document.getElementById(`form-${tab}`).classList.add('active');
    },
    validate: () => {
        const cName = document.getElementById('admin-name').value.trim();
        const gName = document.getElementById('group-name').value.trim();
        document.getElementById('btn-create').disabled = !(cName && gName);

        const jName = document.getElementById('join-name').value.trim();
        const jCode = document.getElementById('join-code').value.trim();
        document.getElementById('btn-join').disabled = !(jName && jCode);
    },
    toggleInfo: (show) => {
        document.getElementById('overlay-info').classList.toggle('active', show);
    },
    zoomImg: (src) => {
        const zoom = document.getElementById('overlay-zoom');
        document.getElementById('zoom-img').src = src;
        zoom.classList.add('active');
    },
    triggerPfp: () => document.getElementById('pfp-input').click(),
    triggerDocs: () => document.getElementById('doc-input').click()
};

// Monitor Inputs
document.querySelectorAll('input').forEach(input => input.addEventListener('input', ui.validate));

// --- CORE ENGINE ---
const core = {
    createRoom: async () => {
        const adminName = document.getElementById('admin-name').value;
        const groupName = document.getElementById('group-name').value;
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const ref = await db.collection('rooms').add({
            name: groupName,
            code: roomCode,
            adminUid: adminName + Date.now(),
            photo: 'https://cdn-icons-png.flaticon.com/512/924/924915.png',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        user = { name: adminName, role: 'admin', roomId: ref.id, uid: adminName + Date.now() };
        core.launch(groupName, roomCode);
    },

    joinRoom: async () => {
        const name = document.getElementById('join-name').value;
        const code = document.getElementById('join-code').value.toUpperCase();

        const snap = await db.collection('rooms').where('code', '==', code).get();
        if(snap.empty) return alert("Room not found");

        const roomId = snap.docs[0].id;
        const roomData = snap.docs[0].data();

        // Create Join Request (Knock Logic)
        await db.collection('rooms').doc(roomId).collection('requests').add({
            name: name,
            uid: name + Date.now(),
            status: 'pending'
        });

        alert("Request sent. Wait for Admin approval.");
    },

    launch: (groupName, roomCode) => {
        document.getElementById('view-auth').classList.remove('active');
        document.getElementById('view-chat').classList.add('active');
        
        document.getElementById('display-group-name').innerText = groupName;
        document.getElementById('display-group-code').innerText = "Code: " + roomCode;
        document.getElementById('info-group-name').innerText = groupName;
        document.getElementById('info-group-code').innerText = "Code: " + roomCode;

        if(user.role === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
            core.listenRequests();
        }
    },

    listenRequests: () => {
        db.collection('rooms').doc(user.roomId).collection('requests')
        .where('status', '==', 'pending')
        .onSnapshot(snap => {
            const strip = document.getElementById('approval-strip');
            document.getElementById('req-count').innerText = snap.size;
            strip.classList.toggle('hidden', snap.size === 0);
        });
    }
};

// --- AUDIO RECORDING (WhatsApp Style) ---
const micBtn = document.getElementById('mic-btn');
micBtn.onmousedown = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = core.sendAudio;
    mediaRecorder.start();
    micBtn.style.transform = "scale(1.3)";
};

micBtn.onmouseup = () => {
    mediaRecorder.stop();
    micBtn.style.transform = "scale(1)";
};

// --- KEYBOARD HANDLING (Requirement 6) ---
// Decouple layout from viewport resizing to keep keyboard static
const viewport = document.querySelector('meta[name=viewport]');
viewport.setAttribute('content', viewport.content + ', height=' + window.innerHeight);

// Message Input Toggles
document.getElementById('msg-input').oninput = function() {
    const hasText = this.value.trim().length > 0;
    document.getElementById('mic-btn').classList.toggle('hidden', hasText);
    document.getElementById('send-btn').classList.toggle('hidden', !hasText);
};
