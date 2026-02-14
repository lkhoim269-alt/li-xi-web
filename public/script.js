let currentUser = "";

async function login() {
    const input = document.getElementById('username');
    if (!input.value.trim()) return alert("Nhập tên bạn ơi!");
    currentUser = input.value.trim();

    const res = await fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser })
    });
    const data = await res.json();
    renderGame(data);
}

function renderGame(data) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('game-section').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = `Chào mừng ${data.username}!`;

    const wrapper = document.getElementById('envelope-wrapper');
    const statusMsg = document.getElementById('status-msg');
    wrapper.innerHTML = "";

    data.envelopes.forEach((env, index) => {
        const div = document.createElement('div');
        div.className = 'envelope';

        if (env.opened) {
            div.classList.add('opened');
            div.innerHTML = `<img src="images/${env.value / 1000}k.jpg">`;
        } else {
            div.innerHTML = `<img src="images/cover.jpg">`;
            if (data.hasOpenedAny) {
                div.classList.add('disabled');
            } else {
                div.onclick = () => openEnvelope(index);
            }
        }
        wrapper.appendChild(div);
    });

    if (data.hasOpenedAny && data.openedAt) {
        statusMsg.innerHTML = `
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; border: 1px dashed gold;">
                <h3 style="color: gold">🧧 ĐÃ NHẬN LỘC 🧧</h3>
                <p>Thời gian: ${data.openedAt}</p>
            </div>`;
    }
}

async function openEnvelope(index) {
    if (!confirm("Bạn chắc chắn muốn bốc bao này? Mỗi người chỉ được bốc 1 lần thôi đó!")) return;

    const res = await fetch('/api/open-envelope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, index })
    });
    const result = await res.json();

    if (result.success) {
        alert(`CHÚC MỪNG! Bạn nhận được tờ ${result.value.toLocaleString()} VNĐ`);
        login(); // Load lại để hiển thị thời gian và trạng thái mới
    } else {
        alert(result.error);
    }
}