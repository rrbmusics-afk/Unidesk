import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDbfmd0zmv_mFV0CG2OrhKPPeU3zPYGOBg",
    authDomain: "unidesk-a70ac.firebaseapp.com",
    projectId: "unidesk-a70ac",
    storageBucket: "unidesk-a70ac.firebasestorage.app",
    databaseURL: "https://unidesk-a70ac-default-rtdb.firebaseio.com", // Ensure your URL is correct
    messagingSenderId: "882535016432",
    appId: "1:882535016432:web:6eca2645a47a827e779f35"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentMode = 'create';
let myID = Math.random().toString(36).substr(2, 9);
let currentLoungeCode = "";

window.showTab = (type) => {
    currentMode = type;
    document.querySelectorAll('.create-field').forEach(el => el.classList.toggle('hidden', type !== 'create'));
    document.querySelectorAll('.join-field').forEach(el => el.classList.toggle('hidden', type !== 'join'));
};

window.handleAction = () => {
    const name = document.getElementById('user-name').value;
    const lName = document.getElementById('lounge-name').value;
    const lCode = document.getElementById('lounge-code-input').value;

    if (!name) return alert("Enter your name");

    if (currentMode === 'create') {
        if (!lName) return alert("Enter Lounge Name");
        currentLoungeCode = Math.floor(1000 + Math.random() * 9000);
        createLounge(name, lName, currentLoungeCode);
    } else {
        if (!lCode) return alert("Enter Lounge Code");
        currentLoungeCode = lCode;
        joinLounge(name, lCode);
    }
};

function createLounge(adminName, loungeName, code) {
    set(ref(db, 'lounges/' + code), {
        info: { name: loungeName, admin: myID },
        members: { [myID]: { name: adminName, status: 'approved' } }
    });
    startChat(loungeName, code, true);
}

function joinLounge(userName, code) {
    const userRef = ref(db, `lounges/${code}/members/${myID}`);
    set(userRef, { name: userName, status: 'knocking' });

    document.getElementById('entry-screen').classList.add('hidden');
    document.getElementById('waiting-screen').classList.remove('hidden');

    // Listen for Approval
    onValue(userRef, (snapshot) => {
        if (snapshot.val()?.status === 'approved') {
            document.getElementById('waiting-screen').classList.add('hidden');
            startChat("Student Lounge", code, false);
        }
    });
}

function startChat(loungeName, code, isAdmin) {
    document.getElementById('entry-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('display-lounge-name').innerText = loungeName;
    document.getElementById('display-lounge-code').innerText = "Code: " + code;

    if (isAdmin) {
        document.getElementById('admin-controls').classList.remove('hidden');
        listenForRequests(code);
    }
    listenForMessages(code);
}

function listenForRequests(code) {
    onValue(ref(db, `lounges/${code}/members`), (snapshot) => {
        const members = snapshot.val();
        const panel = document.getElementById('request-panel');
        panel.innerHTML = "";
        let count = 0;

        for (let id in members) {
            if (members[id].status === 'knocking') {
                count++;
                panel.innerHTML += `<div class="req-item">${members[id].name} 
                    <button onclick="approveUser('${id}', '${code}')">Approve</button></div>`;
            }
        }
        document.getElementById('req-count').innerText = `Requests (${count})`;
    });
}

window.approveUser = (uid, code) => {
    update(ref(db, `lounges/${code}/members/${uid}`), { status: 'approved' });
};

function listenForMessages(code) {
    onValue(ref(db, `lounges/${code}/messages`), (snapshot) => {
        const container = document.getElementById('messages');
        container.innerHTML = "";
        snapshot.forEach(child => {
            const data = child.val();
            const div = document.createElement('div');
            div.className = `msg ${data.senderId === myID ? 'sent' : 'received'}`;
            div.innerText = `${data.senderName}: ${data.text}`;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    });
}

window.sendMessage = () => {
    const text = document.getElementById('msg-input').value;
    const name = document.getElementById('user-name').value;
    if (!text) return;
    push(ref(db, `lounges/${currentLoungeCode}/messages`), {
        senderId: myID,
        senderName: name,
        text: text
    });
    document.getElementById('msg-input').value = "";
};

window.toggleRequests = () => {
    document.getElementById('request-panel').classList.toggle('hidden');
};
