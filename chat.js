// Firebase Configuration (Replace with your actual keys)
const firebaseConfig = { /* config */ };

let currentLounge = null;
let isAdmin = false;
let userName = "";

function showFlow(type) {
    document.getElementById('entrance-screen').classList.remove('active');
    document.getElementById('form-screen').classList.add('active');
    
    if(type === 'create') {
        document.querySelector('.join-only').style.display = 'none';
    } else {
        document.querySelector('.create-only').style.display = 'none';
    }
}

// Generate Unique 6-Char Code
function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

document.getElementById('submit-btn').addEventListener('click', () => {
    userName = document.getElementById('user-name').value;
    const loungeName = document.getElementById('lounge-name').value;
    const inputCode = document.getElementById('lounge-code-input').value;

    if(loungeName) { // CREATE FLOW
        const code = generateCode();
        isAdmin = true;
        setupLounge(code, loungeName);
    } else if(inputCode) { // JOIN FLOW
        knockOnLounge(inputCode);
    }
});

function setupLounge(code, name) {
    // 1. Create entry in Database
    // 2. Set Admin status
    // 3. Open Chat Screen
    document.getElementById('form-screen').classList.remove('active');
    document.getElementById('chat-screen').classList.add('active');
    document.getElementById('active-lounge-name').innerText = name;
    document.getElementById('active-lounge-code').innerText = `#${code}`;
}

function knockOnLounge(code) {
    document.getElementById('form-screen').classList.remove('active');
    document.getElementById('waiting-screen').classList.add('active');
    
    // Logic: Add user to "pending_requests" node in Firebase for this lounge code
    // Listen for status change to "approved"
}

function sendMessage() {
    const text = document.getElementById('msg-input').value;
    if(!text) return;
    
    // Push to /messages/loungeCode
    appendMessage(text, 'sent');
    document.getElementById('msg-input').value = '';
}

function appendMessage(text, type) {
    const feed = document.getElementById('message-container');
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerText = text;
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
}
