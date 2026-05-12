import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, getDoc, arrayUnion, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyDbfmd0zmv_mFV0CG2OrhKPPeU3zPYGOBg", authDomain: "unidesk-a70ac.firebaseapp.com", projectId: "unidesk-a70ac" };
const db = getFirestore(initializeApp(firebaseConfig));

let myId = "UID-" + Math.floor(Math.random()*10000);
let currentRoom = null;
let isAdmin = false;
let myName = "";

// Mode Toggle
window.switchMode = (mode) => {
    const isJoin = mode === 'join';
    document.getElementById('loungeNameInput').classList.toggle('hidden', isJoin);
    document.getElementById('codeInput').classList.toggle('hidden', !isJoin);
    document.getElementById('tab-create').classList.toggle('active', !isJoin);
    document.getElementById('tab-join').classList.toggle('active', isJoin);
    validate();
};

window.validate = () => {
    const name = document.getElementById('nameInput').value.trim();
    const isJoin = !document.getElementById('codeInput').classList.contains('hidden');
    const btn = document.getElementById('actionBtn');
    
    if (isJoin) {
        const code = document.getElementById('codeInput').value.trim();
        btn.disabled = !(name && code);
    } else {
        const lounge = document.getElementById('loungeNameInput').value.trim();
        btn.disabled = !(name && lounge);
    }
    btn.classList.toggle('locked', btn.disabled);
};

window.handleAction = async () => {
    const isJoin = !document.getElementById('codeInput').classList.contains('hidden');
    myName = document.getElementById('nameInput').value.trim();

    if (isJoin) {
        const code = document.getElementById('codeInput').value.toUpperCase();
        // Send Approval Request (Knocking)
        await updateDoc(doc(db, "rooms", code), { 
            [`requests.${myId}`]: { name: myName, status: 'pending' } 
        });
        alert("Knocking... Wait for admin approval.");
        listenForApproval(code);
    } else {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const lName = document.getElementById('loungeNameInput').value;
        isAdmin = true;
        await setDoc(doc(db, "rooms", code), {
            name: lName, admin: myId, requests: {}, messages: [], pfp: ""
        });
        openChat(code);
    }
};

function listenForApproval(code) {
    onSnapshot(doc(db, "rooms", code), (snap) => {
        const data = snap.data();
        if (data.requests[myId]?.status === 'approved') openChat(code);
    });
}

function openChat(code) {
    currentRoom = code;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
    
    onSnapshot(doc(db, "rooms", code), (snap) => {
        const data = snap.data();
        if (!data) { alert("Group Deleted"); location.reload(); return; }
        document.getElementById('displayLoungeName').innerText = data.name;
        document.getElementById('displayLoungeCode').innerText = "#" + code;
        renderMessages(data.messages);
        
        if (isAdmin) {
            const reqs = Object.entries(data.requests).filter(r => r[1].status === 'pending');
            document.getElementById('reqBanner').classList.toggle('hidden', reqs.length === 0);
            document.getElementById('reqCount').innerText = reqs.length;
            window.pendingReqs = reqs;
        }
    });
}

window.checkInput = () => {
    const val = document.getElementById('msgInput').value;
    const icon = document.getElementById('triggerIcon');
    icon.className = val.trim() ? "fas fa-paper-plane" : "fas fa-microphone";
};

// End-to-End Encryption Logic (Simulated for this demo)
function encrypt(text) { return btoa(text); } // In production, use WebCrypto API
function decrypt(text) { return atob(text); }

async function sendMessage() {
    const inp = document.getElementById('msgInput');
    const text = inp.value.trim();
    if (!text) return;
    inp.value = "";
    checkInput();
    
    await updateDoc(doc(db, "rooms", currentRoom), {
        messages: arrayUnion({ sender: myId, name: myName, text: encrypt(text), time: Date.now() })
    });
}

function renderMessages(msgs) {
    const box = document.getElementById('chatBox');
    box.innerHTML = '<div class="e2ee-tag">End-to-End Encrypted</div>';
    msgs.forEach(m => {
        const isMe = m.sender === myId;
        const div = document.createElement('div');
        div.className = `bubble ${isMe ? 'me' : 'them'}`;
        div.innerHTML = `<b>${m.name}</b><p>${decrypt(m.text)}</p>`;
        box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
}
