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

let session = { user: '', roomID: '', role: 'member', uid: '' };

const ui = {
    showView: (id) => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    },
    togglePopup: (show) => document.getElementById('req-popup').classList.toggle('hidden', !show)
};

const lounge = {
    create: async () => {
        const u = document.getElementById('c-user').value.trim();
        const l = document.getElementById('c-lounge').value.trim();
        if(!u || !l) return alert("Fill all fields");

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const ref = await db.collection('lounges').add({
            name: l, code: code, admin: u, createdAt: Date.now()
        });

        session = { user: u, roomID: ref.id, role: 'admin', uid: u + Date.now() };
        lounge.enter();
    },

    knock: async () => {
        const u = document.getElementById('j-user').value.trim();
        const c = document.getElementById('j-code').value.trim().toUpperCase();
        if(!u || !c) return alert("Fill all fields");

        const snap = await db.collection('lounges').where('code', '==', c).get();
        if(snap.empty) return alert("Lounge not found");

        const roomID = snap.docs[0].id;
        const myUID = u + Date.now(); // Ensures unique entry even for same name
        
        await db.collection('lounges').doc(roomID).collection('knocks').doc(myUID).set({
            name: u, status: 'waiting'
        });

        ui.showView('view-waiting');

        // Watch for approval
        db.collection('lounges').doc(roomID).collection('knocks').doc(myUID)
        .onSnapshot(doc => {
            if(doc.data()?.status === 'approved') {
                session = { user: u, roomID: roomID, role: 'member', uid: myUID };
                lounge.enter();
            }
        });
    },

    enter: () => {
        ui.showView('view-hub');
        document.getElementById('display-lounge-name').innerText = session.user + "'s Lounge";
        document.getElementById('display-lounge-code').innerText = "Code: " + (session.roomID.substring(0,6));

        if(session.role === 'admin') {
            document.getElementById('admin-tools').classList.remove('hidden');
            lounge.listenForKnocks();
        }
    },

    listenForKnocks: () => {
        db.collection('lounges').doc(session.roomID).collection('knocks')
        .where('status', '==', 'waiting')
        .onSnapshot(snap => {
            document.getElementById('req-badge').innerText = snap.size;
            const list = document.getElementById('req-list');
            list.innerHTML = '';
            snap.forEach(doc => {
                const div = document.createElement('div');
                div.className = 'req-item';
                div.innerHTML = `
                    <span><b>${doc.data().name}</b> is knocking</span>
                    <button class="acc-btn" onclick="lounge.approve('${doc.id}')">Allow</button>
                `;
                list.appendChild(div);
            });
        });
    },

    approve: async (uid) => {
        await db.collection('lounges').doc(session.roomID).collection('knocks').doc(uid).update({
            status: 'approved'
        });
    }
};
