const firebaseConfig = {
  apiKey: "AIzaSyBoG8vZpGLbZpBz70sXnyt51brXV1FRckk",
  authDomain: "karatedo-pnt.firebaseapp.com",
  projectId: "karatedo-pnt",
  storageBucket: "karatedo-pnt.firebasestorage.app",
  messagingSenderId: "360011050214",
  appId: "1:360011050214:web:57ac58264bc0e85b039f27",
  measurementId: "G-X74TK4KJGB"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Thay UID này bằng UID admin của bạn (lấy trong Firebase Authentication > Users)
const adminUID = "THAY_UID_ADMIN_VAO_DAY";

let generations = [];
let members = [];
let editIndex = null;
let currentMemberId = null;
let isAdmin = false;

// Đăng nhập/đăng xuất Google
firebase.auth().onAuthStateChanged(function(user) {
    isAdmin = (user && user.uid === adminUID);
    document.getElementById("loginBtn").style.display = isAdmin ? "none" : "inline";
    document.getElementById("logoutBtn").style.display = isAdmin ? "inline" : "none";
    document.getElementById("deleteBtn").style.display = isAdmin ? "block" : "none";
    document.getElementById("pendingWrap").style.display = isAdmin ? "block" : "none";
    loadMembersFromFirestore(renderGenerations);
    if (isAdmin) loadPending();
});
document.getElementById("loginBtn").onclick = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
};
document.getElementById("logoutBtn").onclick = function() {
    firebase.auth().signOut();
};

// Hiển thị danh sách chờ phê duyệt cho admin
function loadPending() {
    const wrap = document.getElementById("pendingList");
    wrap.innerHTML = "Đang tải...";
    db.collection("pending_members").get().then(snapshot => {
        wrap.innerHTML = "";
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement("div");
            div.className = "pending-card";
            div.innerHTML = `
                <b>${data.name}</b> - ${data.gender} - ${data.dob} - ${data.join} - ${data.belt} - ${data.gen}
                <button class="approveBtn">Phê duyệt</button>
                <button class="rejectBtn" style="background:#e74c3c;">Từ chối</button>
            `;
            div.querySelector(".approveBtn").onclick = function() {
                db.collection("members").add(data).then(() => {
                    db.collection("pending_members").doc(doc.id).delete().then(loadPending);
                });
            };
            div.querySelector(".rejectBtn").onclick = function() {
                db.collection("pending_members").doc(doc.id).delete().then(loadPending);
            };
            wrap.appendChild(div);
        });
        if (!wrap.innerHTML) wrap.innerHTML = "<i>Không có yêu cầu nào.</i>";
    });
}

function renderGenerations() {
    generations.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.replace(/\D/g, "")) || 0;
        return numA - numB;
    });

    const main = document.getElementById("mainContent");
    main.innerHTML = "";

    const beltColors = {
        trang: "#fff",
        vang: "#ffe066",
        nau: "#a0522d",
        den: "#222"
    };

    generations.forEach(gen => {
        const group = document.createElement("div");
        group.className = "generation-group";

        group.innerHTML = `
            <span class="generation-title">${gen}:</span>
            <div class="generation-row" id="${gen}"></div>
        `;

        const row = group.querySelector(".generation-row");
        members.filter(m => m.gen === gen).forEach(member => {
            const card = document.createElement("div");
            card.className = "card";
            card.onclick = () => showDetails(member);

            const nameDiv = document.createElement("div");
            nameDiv.className = "name";
            nameDiv.textContent = member.name;
            if (member.belt && beltColors[member.belt]) {
                nameDiv.style.color = beltColors[member.belt];
                if (member.belt === "trang") nameDiv.style.textShadow = "0 0 2px #000";
                if (member.belt === "den") nameDiv.style.textShadow = "0 0 4px #fff";
            }

            card.innerHTML = `
                <img src="${member.image || ""}" alt="${member.name}" style="${!member.image ? 'background:#333' : ''}">
            `;
            card.appendChild(nameDiv);
            row.appendChild(card);
        });

        main.appendChild(group);
    });
}

function formatDate(str) {
    if (!str) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split("-");
        return `${d}/${m}/${y}`;
    }
    return str;
}
function parseDate(str) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const [d, m, y] = str.split('/');
    if (!d || !m || !y) return "";
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
function showModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('show');
    modal.classList.remove('hide');
}
function hideModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('hide');
    modal.classList.remove('show');
}
function showDetails(member) {
    currentMemberId = member.id;
    document.getElementById("modalName").textContent = member.name;
    document.getElementById("modalGender").textContent = member.gender;
    document.getElementById("modalDOB").textContent = formatDate(member.dob);
    document.getElementById("modalJoin").textContent = formatDate(member.join);
    document.getElementById("modalBelt").textContent = "Đai " + (
        member.belt === "trang" ? "trắng" :
        member.belt === "vang" ? "vàng" :
        member.belt === "nau" ? "nâu" :
        member.belt === "den" ? "đen" : ""
    );
    document.getElementById("modalAvatar").src = member.image || "";
    document.getElementById("modalAvatar").alt = member.name || "avatar";
    document.getElementById("editBtn").onclick = function() {
        openEditModal(member);
    };
    document.getElementById("deleteBtn").style.display = isAdmin ? "block" : "none";
    showModal("detailModal");
}
function openEditModal(member) {
    const form = document.getElementById("addForm");
    form.name.value = member.name;
    form.dob.value = formatDate(member.dob);
    form.gender.value = member.gender;
    form.join.value = formatDate(member.join);
    form.generation.value = (member.gen || "").replace(/\D/g, "");
    form.belt.value = member.belt;
    showModal("addModal");
    editIndex = members.findIndex(m => m.id === member.id);
}
function resizeImage(base64, maxWidth, maxHeight, callback) {
    const img = new Image();
    img.onload = function() {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = Math.round(width * maxHeight / height);
            height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = base64;
}
function loadMembersFromFirestore(callback) {
    db.collection("members").get().then(snapshot => {
        members = [];
        generations = [];
        snapshot.forEach(doc => {
            let data = doc.data();
            data.id = doc.id;
            members.push(data);
            if (data.gen && !generations.includes(data.gen)) generations.push(data.gen);
        });
        callback();
    });
}
function saveMemberToFirestore(memberData, callback) {
    if (editIndex !== null && members[editIndex].id) {
        db.collection("members").doc(members[editIndex].id).set(memberData).then(() => {
            callback(members[editIndex].id);
        });
    } else {
        db.collection("members").add(memberData).then(docRef => {
            memberData.id = docRef.id;
            callback(docRef.id);
        });
    }
}
document.getElementById("deleteBtn").onclick = function() {
    if (isAdmin && confirm("Bạn có chắc chắn muốn xóa võ sinh này?")) {
        db.collection("members").doc(currentMemberId).delete().then(() => {
            loadMembersFromFirestore(renderGenerations);
            hideModal("detailModal");
        });
    }
};
document.getElementById("addForm").onsubmit = function(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const genNum = data.get("generation").trim();

    if (!/^\d+$/.test(genNum)) {
        alert("Vui lòng nhập số thế hệ hợp lệ!");
        return;
    }

    const dob = data.get("dob").trim();
    const join = data.get("join").trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob) || !/^\d{2}\/\d{2}\/\d{4}$/.test(join)) {
        alert("Ngày phải theo định dạng dd/mm/yyyy!");
        return;
    }

    const genName = "Thế hệ " + genNum;
    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];

    function saveMember(imageBase64) {
        const memberData = {
            name: data.get("name").trim(),
            dob: parseDate(dob),
            gender: data.get("gender"),
            join: parseDate(join),
            image: imageBase64 || "",
            gen: genName,
            belt: data.get("belt")
        };

        if (isAdmin) {
            saveMemberToFirestore(memberData, function(updatedId) {
                loadMembersFromFirestore(function() {
                    renderGenerations();
                    hideModal("addModal");
                    if (editIndex !== null) {
                        const updated = members.find(m => m.id === updatedId);
                        if (updated) showDetails(updated);
                    }
                    editIndex = null;
                    document.getElementById("addForm").reset();
                    document.getElementById("imageInput").value = "";
                });
            });
        } else {
            db.collection("pending_members").add(memberData).then(() => {
                alert("Thông tin của bạn đang chờ phê duyệt!");
                hideModal("addModal");
                document.getElementById("addForm").reset();
                document.getElementById("imageInput").value = "";
            });
        }
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            resizeImage(evt.target.result, 300, 400, saveMember);
        };
        reader.readAsDataURL(file);
    } else {
        if (editIndex !== null && members[editIndex].image) {
            saveMember(members[editIndex].image);
        } else {
            saveMember("");
        }
    }
};
document.getElementById("addMemberBtn").onclick = () => {
    editIndex = null;
    document.getElementById("addForm").reset();
    showModal("addModal");
};
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === modal) hideModal(modal.id);
    });
});
window.onload = function() {
    loadMembersFromFirestore(renderGenerations);
};