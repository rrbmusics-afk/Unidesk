/**
 * Aethercore Secure Communication Engine
 * Optimized for Android Mobile - Professional Standard
 */

// 1. INITIALIZATION & STATE
const db = firebase.firestore();
const storage = firebase.storage();

let userState = {
    role: null, // 'admin' or 'member'
    name: '',
    roomId: null,
    uid: null
};

// 2. UI CONTROLLER - TAB SWITCHING & VALIDATION
function switchTab(type) {
    const createTab = document.getElementById('tab-create');
    const joinTab = document.getElementById('tab-join');
    const createForm = document.getElementById('create-form');
    const joinForm = document.getElementById('join-form');

    if (type === 'create') {
        createTab.classList.add('active');
        joinTab.classList.remove('active');
        createForm.classList.add('active');
        joinForm.classList.remove('active');
    } else {
        joinTab.classList.add('active');
        createTab.classList.remove('active');
        joinForm.classList.add('active');
        createForm.classList.remove('active');
    }
}

// Button Locking Logic: Monitor inputs to enable buttons
const monitorInputs = (formId, buttonId) => {
    const form = document.getElementById(formId);
    const btn = document.getElementById(buttonId);
    const inputs = form.querySelectorAll('input[required]');

    const checkValidity = () => {
        let isValid = true;
        inputs.forEach(input => {
            if (input.value.trim().length < 2) isValid = false;
        });
        btn.disabled = !isValid;
    };

    inputs.forEach(input => input.addEventListener('input', checkValidity));
};

// Initialize listeners on load
document.addEventListener('DOMContentLoaded', () => {
    monitorInputs('create-form', 'btn-create');
    monitorInputs('join-form', 'btn-join');
    setupKeyboardHandler();
});

// 3. CORE FUNCTIONALITY - CREATE & JOIN
async function handleCreate() {
    const adminName = document.getElementById('admin-name').value;
    const groupName = document.getElementById('group-name').value;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const roomRef = await db.collection('rooms').add({
            groupName: groupName,
            roomCode: roomCode,
            adminName: adminName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            photoURL: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        });

        userState = { role: 'admin', name: adminName, roomId: roomRef.id, uid: 'admin_' + Date.now() };
        launchChat(groupName, roomCode);
    } catch (error) {
        console.error("Room Creation Error: ", error);
    }
}

async function handleJoin() {
    const userName = document.getElementById('user-name').value;
    const roomCode = document.getElementById('room-code-input').value.toUpperCase();

    const snapshot = await db.collection('rooms').where('roomCode', '==', roomCode).get();
    
    if (snapshot.empty) {
        alert("Invalid Room Code.");
        return;
    }

    const roomId = snapshot.docs[0].id;
    const roomData = snapshot.docs[0].data();

    // Send Join Request (Approval Logic)
    await db.collection('rooms').doc(roomId).collection('requests').add({
        name: userName,
        uid: 'user_' + Date.now(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Knock sent! Please wait for the Admin to approve you.");
}

// 4. CHAT INTERFACE LOGIC
function launchChat(title, code) {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('chat-screen').classList.add('active');
    
    document.getElementById('chat-title').innerText = title;
    document.getElementById('chat-subtitle').innerText = `Code: ${code}`;
    document.getElementById('info-name').innerText = title;
    document.getElementById('info-code').innerText = `Code: ${code}`;

    if (userState.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        listenForRequests();
    }
}

// 5. INPUT & RECORDING (WhatsApp Style)
const msgInput = document.getElementById('message-input');
const micIcon = document.getElementById('mic-icon');
const sendIcon = document.getElementById('send-icon');

msgInput.addEventListener('input', () => {
    if (msgInput.value.trim() !== "") {
        micIcon.classList.add('hidden');
        sendIcon.classList.remove('hidden');
    } else {
        micIcon.classList.remove('hidden');
        sendIcon.classList.add('hidden');
    }
});

// 6. KEYBOARD OPTIMIZATION (Requirement 6)
function setupKeyboardHandler() {
    // Prevents auto-hide/auto-open by decoupling layout from viewport height changes
    const viewport = document.querySelector('meta[name=viewport]');
    viewport.setAttribute('content', viewport.content + ', height=' + window.innerHeight);
}

// 7. OVERLAY MANAGEMENT
function openGroupInfo() {
    document.getElementById('group-info-overlay').classList.add('active');
}

function closeOverlay(id) {
    document.getElementById(id).classList.remove('active');
}

function zoomImage(src) {
    const zoomImg = document.getElementById('zoomed-image');
    zoomImg.src = src;
    document.getElementById('zoom-overlay').classList.add('active');
    document.getElementById('download-btn').onclick = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = 'Aethercore_Media.jpg';
        link.click();
    };
}

// 8. ADMIN ACTIONS (Delete/Rename)
async function deleteGroup() {
    if (!confirm("Are you sure? This will remove all members permanently.")) return;
    await db.collection('rooms').doc(userState.roomId).delete();
    location.reload();
}

async function leaveGroup() {
    if (userState.role === 'admin') {
        alert("Admins must delete the group to leave.");
    } else {
        location.reload();
    }
}
