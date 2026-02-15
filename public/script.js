let currentUser = "";

// Điều khiển nhạc nền
const musicBtn = document.getElementById('musicBtn');
const bgMusic = document.getElementById('bgMusic');

musicBtn.onclick = () => {
    if (bgMusic.paused) {
        bgMusic.play().catch(() => alert("Hãy tương tác với trang web trước khi bật nhạc!"));
        musicBtn.innerText = "⏸ Tắt Nhạc";
    } else {
        bgMusic.pause();
        musicBtn.innerText = "🎵 Bật Nhạc";
    }
};

// Hàm đăng nhập/khởi tạo người dùng
async function login() {
    const nameInput = document.getElementById('username');
    const name = nameInput.value.trim();

    if (!name) {
        alert("Vui lòng nhập tên của bạn!");
        return;
    }

    currentUser = name;

    try {
        const res = await fetch('/api/user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser })
        });
        const data = await res.json();
        showGame(data);
    } catch (err) {
        alert("Lỗi kết nối server rồi bạn ơi!");
    }
}

// Hiển thị màn hình game
function showGame(user) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('game-section').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = `Chúc mừng năm mới, ${user.username}!`;
    renderEnvelopes(user);
    // Tạm thời ẩn bảng vàng hoặc cập nhật nếu bạn có API riêng
    document.getElementById('history-list').innerHTML = `<li>${user.username} đang sẵn sàng bốc lộc...</li>`;
}

// Vẽ các bao lì xì
function renderEnvelopes(user) {
    const container = document.getElementById('envelope-container');
    container.innerHTML = "";

    user.envelopes.forEach((env, index) => {
        const div = document.createElement('div');
        // Nếu người dùng đã bốc 1 bao rồi thì làm mờ các bao còn lại
        div.className = `envelope ${env.opened ? 'opened' : ''} ${user.hasOpenedAny && !env.opened ? 'disabled' : ''}`;

        const img = document.createElement('img');
        // Nếu bao đã mở thì hiện tiền, chưa mở hiện cover
        img.src = env.opened ? `images/${env.value / 1000}k.jpg` : `images/cover.jpg`;

        div.appendChild(img);

        // Chỉ cho phép click nếu người dùng chưa bốc bao nào
        if (!user.hasOpenedAny) {
            div.onclick = () => openEnvelope(index);
        }
        container.appendChild(div);
    });
}

// Xử lý bốc lì xì
async function openEnvelope(index) {
    try {
        const res = await fetch('/api/open-envelope', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser, index })
        });
        const data = await res.json();

        if (data.success) {
            // 1. Hiệu ứng pháo hoa
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });

            // 2. Thông báo trúng thưởng
            alert(`🧧 Chúc mừng! Bạn nhận được ${data.value.toLocaleString()} VNĐ!`);

            // 3. CẬP NHẬT GIAO DIỆN TẠI CHỖ (Thay vì reload)
            // Lấy lại dữ liệu mới nhất từ server để hiển thị trạng thái đã mở
            const userRes = await fetch('/api/user-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser })
            });
            const userData = await userRes.json();

            // Vẽ lại các bao lì xì với trạng thái mới
            renderEnvelopes(userData);

        } else {
            alert(data.error || "Có lỗi xảy ra!");
        }
    } catch (err) {
        console.error("Lỗi:", err);
        alert("Không thể kết nối đến máy chủ!");
    }
}