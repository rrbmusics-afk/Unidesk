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

let state = { user: '', role: 'member', room: '', code: '' };

const ui = {
    tab: (t) => {
        document.querySelectorAll('.tabs button, .panel').forEach(el => el.classList.remove('active'));
        document.getElementById(`t-${t[0]}`).classList.add('active');
        document.getElementById(`p-${t}`).classList.add('active');
    },
    check: () => {
        const a = document.getElementById('a-name').value;
        const g = document.getElementById('g-name').value;
        document.getElementById('b-c').disabled = !(a && g);

        const j = document.getElementById('j-name').value;
        const c = document.getElementById('j-code').value;
        document.getElementById('b-j').disabled = !(j && c);
    },
    overlay: (id, show) => document.getElementById(`${id}-ov`).classList.toggle('active', show),
    pfp: () => document.getElementById('f-pfp').click(),
    docs: () => document.getElementById('f-doc').click()
};

const core = {
    create: async () => {
        const admin = document.getElementById('a-name').value;
        const group = document.getElementById('g-name').value;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const ref = await db.collection('rooms').add({
            name: group, code: code, admin: admin, 
            pfp: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        });

        state = { user: admin, role: 'admin', room: ref.id, code: code, name: group };
        core.launch();
    },
    launch: () => {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('chat-screen').classList.add('active');
        document.getElementById('h-name').innerText = state.name;
        document.getElementById('h-code').innerText = "Code: " + state.code;
        document.getElementById('i-name').innerText = state.name;
        document.getElementById('i-code').innerText = "Room Code: " + state.code;

        if(state.role === 'admin') document.querySelectorAll('.adm').forEach(e => e.classList.remove('hidden'));
    }
};

// Toggle send button
document.getElementById('input').oninput = function() {
    const val = this.value.trim().length > 0;
    document.getElementById('mic').classList.toggle('hidden', val);
    document.getElementById('send').classList.toggle('hidden', !val);
};
