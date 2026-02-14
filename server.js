const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const app = express();

const adapter = new FileSync('db.json');
const db = low(adapter);
db.defaults({ users: [] }).write();

app.use(express.json());
app.use(express.static('public'));

const DENOMINATIONS = [2000, 5000, 10000, 20000];

app.post('/api/user-data', (req, res) => {
    const { username } = req.body;
    let user = db.get('users').find({ username: username.trim() }).value();

    if (!user) {
        const envelopes = Array.from({ length: 5 }, () => ({
            value: DENOMINATIONS[Math.floor(Math.random() * DENOMINATIONS.length)],
            opened: false
        }));
        user = { username: username.trim(), envelopes, hasOpenedAny: false, openedAt: null };
        db.get('users').push(user).write();
    }
    res.json(user);
});

app.post('/api/open-envelope', (req, res) => {
    const { username, index } = req.body;
    // Tìm user và ép kiểu dữ liệu để chắc chắn ghi được vào DB
    const user = db.get('users').find({ username: username.trim() }).value();

    if (!user) return res.status(404).json({ error: "Không tìm thấy user" });
    if (user.hasOpenedAny) return res.status(400).json({ error: "Bạn đã bốc rồi!" });

    // Lấy thời gian
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} - ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    // Cập nhật mảng envelopes
    user.envelopes[index].opened = true;
    user.hasOpenedAny = true;
    user.openedAt = timeString;

    // Ghi đè lại object user vào DB
    db.get('users').find({ username: username.trim() }).assign(user).write();

    res.json({ success: true, value: user.envelopes[index].value, openedAt: timeString });
});

app.listen(3000, () => console.log('🧧 Server chạy tại http://localhost:3000'));