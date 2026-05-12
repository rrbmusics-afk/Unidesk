// --- UNIDESK DARK THEME CSS ---
const css = `
:root { 
    --primary-blue: #4A90E2; 
    --bg-dark: #0B141B; 
    --card-bg: #121D26; 
    --text-main: #FFFFFF;
    --text-dim: #6B7C8C;
}

body { 
    margin: 0; 
    font-family: 'Inter', -apple-system, sans-serif; 
    background: var(--bg-dark); 
    color: var(--text-main); 
    overflow: hidden; 
}

.hidden { display: none !important; }
.view { height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }

.card { 
    background: var(--card-bg); 
    padding: 40px 30px; 
    border-radius: 32px; 
    border: 1px solid rgba(74, 144, 226, 0.2);
    width: 100%; 
    max-width: 400px; 
    text-align: center; 
}

.brand { 
    font-style: italic; 
    font-weight: 900; 
    font-size: 38px; 
    color: var(--primary-blue); 
    margin: 0; 
    letter-spacing: -1px;
}

.subtitle { 
    font-size: 10px; 
    letter-spacing: 3px; 
    color: var(--text-dim); 
    margin-bottom: 30px;
}

.tabs { display: flex; background: #081016; padding: 5px; border-radius: 14px; margin-bottom: 25px; }
.tabs button { 
    flex: 1; border: none; padding: 12px; border-radius: 10px; 
    font-weight: 600; cursor: pointer; background: transparent; 
    color: var(--text-dim); transition: 0.3s; 
}
.tabs button.active { background: var(--primary-blue); color: #fff; }

input { 
    width: 100%; padding: 16px; margin: 10px 0; 
    border: 1px solid rgba(255,255,255,0.05); 
    background: #081016; color: #fff; 
    border-radius: 14px; font-size: 15px; outline: none; 
}

#main-action-btn { 
    width: 100%; padding: 16px; border: none; border-radius: 14px; 
    background: var(--primary-blue); color: #fff; font-weight: 800; 
    cursor: pointer; margin-top: 15px; letter-spacing: 1px;
}

.chat-container { 
    width: 100%; max-width: 500px; height: 94vh; 
    background: var(--card-bg); border-radius: 32px; 
    display: flex; flex-direction: column; overflow: hidden; 
    border: 1px solid rgba(74, 144, 226, 0.1);
}

header { padding: 20px 25px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
#chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }

.bubble { padding: 14px 18px; border-radius: 20px; max-width: 80%; font-size: 14px; }
.mine { align-self: flex-end; background: var(--primary-blue); color: #fff; border-bottom-right-radius: 4px; }
.theirs { align-self: flex-start; background: #1C2B38; color: #fff; border-bottom-left-radius: 4px; }

.bottom-bar { padding: 20px; background: #0B141B; display: flex; gap: 12px; }
.bottom-bar button { background: var(--primary-blue); color: white; border: none; border-radius: 12px; padding: 0 20px; font-weight: bold; }

.loader-circle { width: 40px; height: 40px; border: 3px solid rgba(74, 144, 226, 0.1); border-top-color: var(--primary-blue); border-radius: 50%; margin: 0 auto 20px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

const styleSheet = document.createElement("style"); styleSheet.innerText = css; document.head.appendChild(styleSheet);

// --- FIREBASE LOGIC ---
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

    if(!name) return;

    if(currentMode === 'create') {
        if(!lName) return;
        activeCode = Math.floor(1000 + Math.random() * 9000).toString();
        set(ref(db, 'lounges/' + activeCode), {
            meta: { name: lName, admin: userId },
            users: { [userId]: { name: name, status: 'approved' } }
        }).then(() => openLounge(lName, activeCode, true));
    } else {
        if(!lCode) return;
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
                    drawer.innerHTML += `<div style="background:#081016; padding:12px; margin-bottom:8px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:13px">${users[id].name}</span> 
                    <button onclick="approveUser('${id}')" style="background:var(--primary-blue); color:#fff; border:none; padding:6px 15px; border-radius:8px; font-weight:bold; cursor:pointer">ALLOW</button></div>`;
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
                <small style="display:block;font-size:10px;opacity:0.4;margin-bottom:4px;text-transform:uppercase">${d.user}</small>${d.msg}</div>`;
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
