let generations = JSON.parse(localStorage.getItem("generations") || "[]");
let members = JSON.parse(localStorage.getItem("members") || "[]");
let editIndex = null; // Biến toàn cục lưu vị trí member đang sửa

function saveData() {
    localStorage.setItem("generations", JSON.stringify(generations));
    localStorage.setItem("members", JSON.stringify(members));
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

// Format date from ISO or yyyy-mm-dd to dd/mm/yyyy (không dùng new Date để tránh lệch ngày)
function formatDate(str) {
    if (!str) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split("-");
        return `${d}/${m}/${y}`;
    }
    return str;
}

// Chuyển dd/mm/yyyy thành yyyy-mm-dd để lưu
function parseDate(str) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const [d, m, y] = str.split('/');
    if (!d || !m || !y) return "";
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// Hiệu ứng mở/đóng modal
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

// Show member details in modal
function showDetails(member) {
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
    showModal("detailModal");
}

// Close modal by id
function closeModal(id) {
    hideModal(id);
}

// Mở modal chỉnh sửa, điền sẵn dữ liệu
function openEditModal(member) {
    const form = document.getElementById("addForm");
    form.name.value = member.name;
    form.dob.value = formatDate(member.dob);
    form.gender.value = member.gender;
    form.join.value = formatDate(member.join);
    // Không set form.image.value vì là input file
    form.generation.value = (member.gen || "").replace(/\D/g, "");
    form.belt.value = member.belt;
    showModal("addModal");
    editIndex = members.findIndex(m => m === member);
}

// Resize ảnh trước khi lưu (giảm quota)
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
        callback(canvas.toDataURL('image/jpeg', 0.7)); // nén jpeg chất lượng 70%
    };
    img.src = base64;
}

// Thêm/sửa thành viên
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
    if (!generations.includes(genName)) generations.push(genName);

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

        if (editIndex !== null) {
            members[editIndex] = memberData;
            saveData();
            renderGenerations();
            hideModal("addModal");
            showDetails(memberData);
            editIndex = null;
        } else {
            members.push(memberData);
            saveData();
            renderGenerations();
            hideModal("addModal");
        }
        e.target.reset();
        document.getElementById("imageInput").value = ""; // Reset input file
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            resizeImage(evt.target.result, 300, 400, saveMember); // Resize về 300x400px
        };
        reader.readAsDataURL(file);
    } else {
        // Nếu không chọn file, giữ ảnh cũ khi sửa hoặc để trống khi thêm mới
        if (editIndex !== null && members[editIndex].image) {
            saveMember(members[editIndex].image);
        } else {
            saveMember("");
        }
    }
};

// Open add member modal (reset editIndex)
document.getElementById("addMemberBtn").onclick = () => {
    editIndex = null;
    document.getElementById("addForm").reset();
    showModal("addModal");
};

// Đóng modal khi click ra ngoài
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === modal) hideModal(modal.id);
    });
});

// Clear all data
document.getElementById("clearBtn").onclick = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?")) {
        localStorage.clear();
        location.reload();
    }
};

// Hiển thị các thế hệ và thành viên khi load lại trang
window.onload = function() {
    renderGenerations();
};