const firebaseConfig = {
    apiKey: "AIzaSyBoG8vZpGLbZpBz70sXnyt51brXV1FRckk",
    authDomain: "karatedo-pnt.firebaseapp.com",
    projectId: "karatedo-pnt",
    storageBucket: "karatedo-pnt.appspot.com", // Đúng định dạng storageBucket
    messagingSenderId: "360011050214",
    appId: "1:360011050214:web:57ac58264bc0e85b039f27",
    measurementId: "G-X74TK4KJGB"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const adminUID = "THAY_UID_ADMIN_VAO_DAY";
let generations = [];
let members = [];
let editIndex = null;
let currentMemberId = null;
let isAdmin = false;

document.body.style.display = "none";

firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
        document.body.style.display = "block";
        const main = document.getElementById("mainContent");
        if (main) main.innerHTML = "<div style='padding:40px;text-align:center'>Bạn cần đăng nhập Google để sử dụng.</div>";
        showElement("googleSignInBtn", "inline");
        hideElement("logoutBtn");
        hideElement("addMemberBtn");
        hideElement("pendingWrap");
        return;
    }
    document.body.style.display = "block";
    hideElement("googleSignInBtn");
    showElement("logoutBtn", "inline");
    showElement("addMemberBtn", "inline");
    isAdmin = (user.uid === adminUID);
    showElement("pendingWrap", isAdmin ? "block" : "none");
    loadMembersFromFirestore(renderGenerations);
    if (isAdmin) loadPending();
});

function showElement(id, display = "block") {
    const el = document.getElementById(id);
    if (el) el.style.display = display;
}
function hideElement(id) {
    showElement(id, "none");
}

const googleSignInBtn = document.getElementById("googleSignInBtn");
if (googleSignInBtn) {
    googleSignInBtn.onclick = function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider);
    };
}
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.onclick = function() {
        firebase.auth().signOut();
    };
}

// Giữ nguyên các hàm quản lý võ sinh phía dưới (renderGenerations, loadMembersFromFirestore, loadPending, showDetails, openEditModal, v.v.)
// ... (copy lại các hàm quản lý võ sinh từ code cũ của bạn ở đây, KHÔNG cần sửa đổi gì thêm)
