const express = require('express');
const mongoose = require('mongoose');
const app = express();

// 1. KẾT NỐI MONGODB
// Thay thế đoạn dưới đây bằng Connection String bạn lấy từ MongoDB Atlas
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Đã kết nối MongoDB Atlas thành công!"))
    .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

// 2. ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU (SCHEMA)
const UserSchema = new mongoose.Schema({
    username: String,
    envelopes: [{
        value: Number,
        opened: Boolean
    }],
    hasOpenedAny: { type: Boolean, default: false },
    openedAt: String
});

const User = mongoose.model('User', UserSchema);

app.use(express.json());
app.use(express.static('public'));

const DENOMINATIONS = [2000, 5000, 10000, 20000];

// 3. API: LẤY HOẶC TẠO DỮ LIỆU NGƯỜI DÙNG
app.post('/api/user-data', async (req, res) => {
    try {
        const { username } = req.body;
        const name = username.trim();

        let user = await User.findOne({ username: name });

        if (!user) {
            const envelopes = Array.from({ length: 5 }, () => ({
                value: DENOMINATIONS[Math.floor(Math.random() * DENOMINATIONS.length)],
                opened: false
            }));
            user = new User({ username: name, envelopes });
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Lỗi server" });
    }
});

// 4. API: XỬ LÝ BÓC LÌ XÌ
app.post('/api/open-envelope', async (req, res) => {
    try {
        const { username, index } = req.body;
        const user = await User.findOne({ username: username.trim() });

        if (!user) return res.status(404).json({ error: "Không thấy người dùng" });
        if (user.hasOpenedAny) return res.status(400).json({ error: "Bạn đã bốc rồi!" });

        // Lấy thời gian hiện tại
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

        // Cập nhật dữ liệu
        user.envelopes[index].opened = true;
        user.hasOpenedAny = true;
        user.openedAt = timeString;

        await user.save(); // Lưu vĩnh viễn vào đám mây

        res.json({
            success: true,
            value: user.envelopes[index].value,
            openedAt: timeString
        });
    } catch (err) {
        res.status(500).json({ error: "Lỗi khi lưu dữ liệu" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại port ${PORT}`));