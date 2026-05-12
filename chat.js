import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, collection, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { /* Your Config Here */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUser = { name: "", role: "member", id: Date.now().toString() };
let activeLounge = null;
let mediaRecorder;
let audioChunks = [];

// 1. Form Validation (Lock/Unlock Buttons)
window.validateForm = () => {
    const isCreate = !document.getElementById('create-tab').classList.contains('hidden');
    if (isCreate) {
        const name = document.getElementById('create-user-name').value;
        const lounge = document.getElementById('create-lounge-name').value;
        const btn = document.getElementById('create-proceed');
        btn.disabled = !(name && lounge);
        btn.classList.toggle('locked', btn.disabled);
    } else {
        const name = document.getElementById('join-user-name').value;
        const code = document.getElementById('join-lounge-code').value;
        const btn = document.getElementById('join-proceed');
        btn.disabled = !(name && code.length === 6);
        btn.classList.toggle('locked', btn.disabled);
    }
};

// 2. Create Lounge (Admin)
window.handleCreate = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const loungeName = document.getElementById('create-lounge-name').value;
    currentUser.name = document.getElementById('create-user-name').value;
    currentUser.role = "admin";

    await setDoc(doc(db, "lounges", code), {
        name: loungeName,
        adminId: currentUser.id,
        createdAt: new Date(),
        pfp: "default.png"
    });

    enterChat(code, loungeName);
};

// 3. The Knocking System (Join Request)
window.handleJoin = async () => {
    const code = document.getElementById('join-lounge-code').value;
    currentUser.name = document.getElementById('join-user-name').value;

    // Add to pending_requests sub-collection
    await addDoc(collection(db, "lounges", code, "requests"), {
        userId: currentUser.id,
        userName: currentUser.name,
        status: "pending"
    });

    showWaitingScreen();
    
    // Listen for Approval
    onSnapshot(collection(db, "lounges", code, "requests"), (snap) => {
        snap.forEach(doc => {
            if(doc.data().userId === currentUser.id && doc.data().status === "approved") {
                enterChat(code, "Lounge Joined");
            }
        });
    });
};

// 4. Voice Recording Logic
const actionBtn = document.getElementById('action-trigger');
actionBtn.addEventListener('mousedown', startRecording);
actionBtn.addEventListener('mouseup', stopAndSendRecording);

async function startRecording() {
    if (document.getElementById('msg-input').value) return; // Don't record if typing
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    actionBtn.classList.add('recording');
    
    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
    mediaRecorder.start();
}

async function stopAndSendRecording() {
    if (!mediaRecorder || mediaRecorder.state === "inactive") return;
    
    mediaRecorder.stop();
    actionBtn.classList.remove('recording');
    
    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
        // Upload audioBlob to Firebase Storage...
        // Send message with audio URL...
        audioChunks = [];
    };
}

// 5. Toggle Voice vs Send
window.toggleVoiceMode = () => {
    const input = document.getElementById('msg-input');
    const icon = document.getElementById('trigger-icon');
    if (input.value.length > 0) {
        icon.className = "fas fa-paper-plane";
        actionBtn.onmousedown = sendMessage; // Switch functionality
    } else {
        icon.className = "fas fa-microphone";
        actionBtn.onmousedown = startRecording;
    }
};

function enterChat(code, name) {
    document.getElementById('entrance-screen').classList.remove('active');
    document.getElementById('chat-screen').classList.add('active');
    document.getElementById('display-lounge-name').innerText = name;
    document.getElementById('display-lounge-code').innerText = `#${code}`;
    if (currentUser.role === 'admin') {
        document.getElementById('admin-badge').classList.remove('hidden');
    }
}
