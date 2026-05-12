// --- PREMIUM MINIMALIST CSS INJECTION ---
const css = `
:root { --blue: #007AFF; --bg: #F2F2F7; --white: #FFFFFF; --text: #1C1C1E; --gray: #8E8E93; }
body { margin: 0; font-family: -apple-system, sans-serif; background: var(--bg); color: var(--text); overflow: hidden; }
.hidden { display: none !important; }
.view { height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
.card { background: var(--white); padding: 30px; border-radius: 28px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); width: 100%; max-width: 380px; text-align: center; }
.tabs { display: flex; background: #E5E5EA; padding: 4px; border-radius: 12px; margin-bottom: 20px; }
.tabs button { flex: 1; border: none; padding: 10px; border-radius: 9px; font-weight: 600; cursor: pointer; background: transparent; transition: 0.2s; }
.tabs button.active { background: var(--white); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
input { width: 100%; padding: 14px; margin: 10px 0; border: 1px solid #D1D1D6; border-radius: 12px; font-size: 16px; outline: none; box-sizing: border-box; }
#main-action-btn { width: 100%; padding: 15px; border: none; border-radius: 12px; background: #000; color: #fff; font-weight: bold; cursor: pointer; margin-top: 10px; }
.chat-container { width: 100%; max-width: 500px; height: 92vh; background: var(--white); border-radius: 30px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.12); }
header { padding: 18px 24px; border-bottom: 1px solid #F2F2F7; display: flex; justify-content: space-between; align-items: center; }
#chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; background: #fafafa; }
.bubble { padding: 12px 16px; border-radius: 20px; max-width: 75%; font-size: 15px; position: relative; }
.mine { align-self: flex-end; background: var(--blue); color: #fff; border-bottom-right-radius: 4px; }
.theirs { align-self: flex-start; background: #E5E5EA; color: #000; border-bottom-left-radius: 4px; }
.bottom-bar { padding: 15px; border-top: 1px solid #F2F2F7; display: flex; gap: 10px; }
.loader-circle { width: 40px; height: 40px; border: 4px solid #E5E5EA; border-top-color: var(--blue); border-radius: 50%; margin: 0 auto 20px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.req-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #F9F9F9; margin-bottom: 5px; border-radius: 10px; }
`;
const styleSheet = document.createElement("style"); styleSheet.innerText = css; document.head.appendChild(styleSheet);

// --- FIREBASE CORE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDbfmd0zmv_mFV0CG2OrhKPPeU3zPYGOBg",
    authDomain: "unidesk-a70ac.firebaseapp.com",
    projectId: "unidesk-a70ac",
    databaseURL: "https://unidesk-a70ac-default-rtdb.firebaseio.com",
    appId: "1:882535016432:web:6eca2645a47a827e779f35"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentMode = 'create';
let userId = localStorage.getItem('std_id') || Math.random().toString(36).substring(7);
localStorage.setItem('std_id', userId);
let activeCode = "";

window.switchTab = (mode) => {
    currentMode = mode;
    document.getElementById('tab-create').classList.toggle('active', mode === 'create');
    document.getElementById('tab-join').classList.toggle('active', mode === 'join');
    document.getElementById('lounge-name').classList.toggle('hidden', mode === 'join');
    document.getElementById('lounge-code-input').classList.toggle('hidden', mode === 'create');
};

window.processEntry = () => {
    const name = document.getElementById('username').value;
    const lName = document.getElementById('lounge-name').value;
    const lCode = document.getElementById('lounge-code-input').value;

    if(!name) return alert("Name required");

    if(currentMode === 'create') {
        if(!lName) return alert("Lounge Name required");
        activeCode = Math.floor(1000 + Math.random() * 9000).toString();
        set(ref(db, 'lounges/' + activeCode), {
            meta: { name: lName, admin: userId },
            users: { [userId]: { name: name, status: 'approved' } }
        }).then(() => openLounge(lName, activeCode, true));
    } else {
        if(!lCode) return alert("Enter Code");
        activeCode = lCode;
        set(ref(db, `lounges/${lCode}/users/${userId}`), { name: name, status: 'knocking' });
        document.getElementById('entrance-view').classList.add('hidden');
        document.getElementById('knocking-view').classList.remove('hidden');

        onValue(ref(db, `lounges/${lCode}/users/${userId}`), (snap) => {
            if(snap.val()?.status === 'approved') openLounge("Student Lounge", lCode, false);
        });
    }
};

function openLounge(lName, code, isAdmin) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('chat-view').classList.remove('hidden');
    document.getElementById('header-lname').innerText = lName;
    document.getElementById('header-lcode').innerText = `#${code}`;

    if(isAdmin) {
        document.getElementById('admin-tools').classList.remove('hidden');
        onValue(ref(db, `lounges/${code}/users`), (snap) => {
            const users = snap.val();
            const drawer = document.getElementById('request-drawer');
            drawer.innerHTML = "";
            let count = 0;
            for(let id in users) {
                if(users[id].status === 'knocking') {
                    count++;
                    drawer.innerHTML += `<div class="req-item"><span>${users[id].name}</span> 
                    <button onclick="approveUser('${id}')" style="background:#34C759;color:#fff;border:none;padding:5px 12px;border-radius:8px;cursor:pointer">Allow</button></div>`;
                }
            }
            document.getElementById('req-count').innerText = count;
        });
    }

    onValue(ref(db, `lounges/${code}/messages`), (snap) => {
        const box = document.getElementById('chat-messages');
        box.innerHTML = "";
        snap.forEach(m => {
            const d = m.val();
            box.innerHTML += `<div class="bubble ${d.uid === userId ? 'mine' : 'theirs'}">
                <small style="display:block;font-size:10px;opacity:0.6;margin-bottom:2px">${d.user}</small>${d.msg}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

window.approveUser = (uid) => update(ref(db, `lounges/${activeCode}/users/${uid}`), { status: 'approved' });
window.toggleRequests = () => document.getElementById('request-drawer').classList.toggle('hidden');
window.handleSend = () => {
    const input = document.getElementById('chat-input');
    if(!input.value) return;
    push(ref(db, `lounges/${activeCode}/messages`), {
        uid: userId, user: document.getElementById('username').value, msg: input.value
    });
    input.value = "";
};
