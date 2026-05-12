import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDbfmd0zmv_mFV0CG2OrhKPPeU3zPYGOBg",
    authDomain: "unidesk-a70ac.firebaseapp.com",
    projectId: "unidesk-a70ac",
    storageBucket: "unidesk-a70ac.firebasestorage.app",
    messagingSenderId: "882535016432",
    appId: "1:882535016432:web:6eca2645a47a827e779f35"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUID = localStorage.getItem('ae_uid') || 'U' + Date.now();
localStorage.setItem('ae_uid', currentUID);

let activeRoom = null;
let isAdmin = false;
let recorder = null;
let audioChunks = [];

// 1. TABS & VALIDATION
window.switchTab = (type) => {
    document.getElementById('panel-create').classList.toggle('hidden', type !== 'create');
    document.getElementById('panel-join').classList.toggle('hidden', type !== 'join');
    document.getElementById('tab-c').className = type === 'create' ? 'active' : '';
    document.getElementById('tab-j').className = type === 'join' ? 'active' : '';
};

window.validateAuth = () => {
    const isCreate = !document.getElementById('panel-create').classList.contains('hidden');
    if(isCreate) {
        const u = document.getElementById('c-user').value.trim();
        const g = document.getElementById('c-group').value.trim();
        document.getElementById('btn-create').classList.toggle('btn-locked', !u || !g);
    } else {
        const u = document.getElementById('j-user').value.trim();
        const c = document.getElementById('j-code').value.trim();
        document.getElementById('btn-join').classList.toggle('btn-locked', !u || c.length < 6);
    }
};

// 12. SMART INPUT & VOICE (WhatsApp Logic)
const msgInput = document.getElementById('msg-input');
const actionBtn = document.getElementById('action-btn');
const actionIcon = document.getElementById('action-icon');

window.autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    actionIcon.className = el.value.trim() ? "fa-solid fa-paper-plane" : "fa-solid fa-microphone";
};

// Long Press for Voice (Point 12)
actionBtn.addEventListener('mousedown', startVoice);
actionBtn.addEventListener('mouseup', stopVoice);
actionBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startVoice(); });
actionBtn.addEventListener('touchend', stopVoice);

async function startVoice() {
    if(msgInput.value.trim()) { sendText(); return; }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    audioChunks = [];
    recorder.ondataavailable = e => audioChunks.push(e.data);
    recorder.onstop = () => {
        console.log("Audio sent automatically upon release");
        // Firebase Storage Upload logic here
    };
    recorder.start();
    actionBtn.style.background = "#ff4b4b";
}

function stopVoice() {
    if(recorder && recorder.state === "recording") {
        recorder.stop();
        actionBtn.style.background = "var(--accent)";
    }
}

// 2 & 3. ADMIN / MEMBER LOGIC
async function handleCreate() {
    const name = document.getElementById('c-user').value;
    const group = document.getElementById('c-group').value;
    const code = Math.random().toString(36).substr(2,6).toUpperCase();
    
    await setDoc(doc(db, "rooms", code), {
        id: code, subject: group, admin: currentUID,
        members: [{uid: currentUID, name}],
        mIDs: [currentUID], requests: [], msgs: [],
        pfp: `https://ui-avatars.com/api/?name=${group}&background=00f2ff&color=000`
    });
    enterChat(code, name);
}

function enterChat(code, userName) {
    activeRoom = code;
    localStorage.setItem('ae_name', userName);
    document.getElementById('screen-home').classList.remove('active');
    document.getElementById('screen-chat').classList.add('active');

    onSnapshot(doc(db, "rooms", code), (s) => {
        if(!s.exists()) { location.reload(); return; }
        const data = s.data();
        isAdmin = data.admin === currentUID;
        
        document.getElementById('header-title').innerText = data.subject;
        document.getElementById('header-code').innerText = `CODE: ${data.id}`;
        document.getElementById('header-pfp').src = data.pfp;
        
        // 4. Approval Visibility
        if(isAdmin && data.requests.length > 0) {
            document.getElementById('admin-banner').classList.remove('hidden');
        } else {
            document.getElementById('admin-banner').classList.add('hidden');
        }
    });
}
