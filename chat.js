// --- CONFIGURATION & INITIALIZATION ---
// (Firebase SDK already imported in chat.html)
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = { name: '', role: 'member', id: '' };
let currentRoom = { id: '', name: '', adminId: '' };
let mediaRecorder;
let audioChunks = [];

// --- UI ELEMENT SELECTORS ---
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const createBtn = document.getElementById('btn-create');
const joinBtn = document.getElementById('btn-join');

// --- 1. AUTH & ROOM LOGIC ---

// Form Validation Logic (Unlocks buttons only when valid)
const validateInputs = (formId) => {
    const form = document.getElementById(formId);
    const btn = formId === 'create-form' ? createBtn : joinBtn;
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    inputs.forEach(input => { if (!input.value.trim()) isValid = false; });
    btn.disabled = !isValid;
};

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
        validateInputs('create-form');
        validateInputs('join-form');
    });
});

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
}

// Create Room
document.getElementById('create-form').onsubmit = async (e) => {
    e.preventDefault();
    const adminName = document.getElementById('admin-name').value;
    const groupName = document.getElementById('group-name').value;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const roomRef = await db.collection('rooms').add({
        name: groupName,
        code: roomCode,
        adminId: adminName + Date.now(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        photoURL: 'default-group.png'
    });

    setupUser(adminName, 'admin', roomRef.id);
};

// Join Room (Knock/Approval Logic)
document.getElementById('join-form').onsubmit = async (e) => {
    e.preventDefault();
    const userName = document.getElementById('user-name').value;
    const code = document.getElementById('room-code-input').value.toUpperCase();

    const snapshot = await db.collection('rooms').where('code', '==', code).get();
    if (snapshot.empty) return alert("Room not found");

    const roomId = snapshot.docs[0].id;
    
    // Create Join Request
    await db.collection('rooms').doc(roomId).collection('requests').add({
        name: userName,
        uid: userName + Date.now(),
        status: 'pending'
    });

    alert("Request sent to Admin. Please wait for approval.");
};

// --- 2. CHAT FUNCTIONALITY ---

function setupUser(name, role, roomId) {
    currentUser = { name, role, id: name + Date.now() };
    enterChat(roomId);
}

function enterChat(roomId) {
    authScreen.classList.remove('active');
    chatScreen.classList.add('active');
    loadMessages(roomId);
    listenForApprovals(roomId);
}

// WhatsApp-style Input Toggle
msgInput.addEventListener('input', () => {
    if (msgInput.value.trim().length > 0) {
        voiceBtn.classList.add('hidden');
        sendBtn.classList.remove('hidden');
    } else {
        voiceBtn.classList.remove('hidden');
        sendBtn.classList.add('hidden');
    }
});

// --- 3. ENCRYPTION & SECURITY ---

function encryptData(text) {
    // In a real ₹10L project, use SubtleCrypto API. 
    // This is a placeholder for the E2EE bridge.
    return btoa(unescape(encodeURIComponent(text))); 
}

function decryptData(encoded) {
    return decodeURIComponent(escape(atob(encoded)));
}

// --- 4. VOICE RECORDING (WhatsApp Style) ---

voiceBtn.onmousedown = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = uploadAudio;
    mediaRecorder.start();
    voiceBtn.style.color = "red";
};

voiceBtn.onmouseup = () => {
    mediaRecorder.stop();
    voiceBtn.style.color = "var(--accent-color)";
};

async function uploadAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
    const fileRef = storage.ref(`audio/${Date.now()}.mp3`);
    await fileRef.put(audioBlob);
    const url = await fileRef.getDownloadURL();
    sendMessage(url, 'audio');
}

// --- 5. DOCUMENT ATTACHMENT ---

document.getElementById('attach-btn').onclick = () => document.getElementById('doc-upload').click();

document.getElementById('doc-upload').onchange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    for (const file of files) {
        const ref = storage.ref(`docs/${file.name}`);
        await ref.put(file);
        const url = await ref.getDownloadURL();
        sendMessage(url, 'document', file.name);
    }
};

// --- 6. ADMIN OPERATIONS ---

function listenForApprovals(roomId) {
    if (currentUser.role !== 'admin') return;
    
    db.collection('rooms').doc(roomId).collection('requests')
        .where('status', '==', 'pending')
        .onSnapshot(snap => {
            const bar = document.getElementById('admin-approval-bar');
            const count = document.getElementById('request-count');
            if (snap.size > 0) {
                bar.classList.remove('hidden');
                count.innerText = snap.size;
            } else {
                bar.classList.add('hidden');
            }
        });
}

async function approveMember(requestId, userId) {
    await db.collection('rooms').doc(currentRoom.id).collection('requests').doc(requestId).update({
        status: 'approved'
    });
    // Further logic to add user to 'members' sub-collection
}

// Profile Photo Logic (1:1 Ratio WhatsApp style)
document.getElementById('change-photo-btn').onclick = () => {
    if (currentUser.role === 'admin') document.getElementById('photo-upload').click();
};

document.getElementById('photo-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const ref = storage.ref(`profiles/${currentRoom.id}`);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    await db.collection('rooms').doc(currentRoom.id).update({ photoURL: url });
};

// --- 7. UI UTILS ---

function openGroupInfo() {
    document.getElementById('group-info-overlay').classList.add('active');
}

function closeOverlay(id) {
    document.getElementById(id).classList.remove('active');
}

function viewLargeImage(src) {
    const viewer = document.getElementById('media-viewer');
    document.getElementById('large-view-img').src = src;
    viewer.classList.add('active');
}

// Keyboard handling for Android (Prevent auto-hide)
window.addEventListener('resize', () => {
    // If the window height decreases significantly, we assume keyboard is out.
    // We maintain the scroll position of the chat area.
    const activeElement = document.activeElement;
    if (activeElement.tagName === "TEXTAREA" || activeElement.tagName === "INPUT") {
        activeElement.scrollIntoView({ behavior: 'smooth' });
    }
});
