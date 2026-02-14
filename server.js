const express = require('express');
const mongoose = require('mongoose');
const app = express();

// KẾT NỐI MONGODB (Thay đoạn dưới bằng link của bạn)
const mongoURI = "mongodb+srv://YOUR_USER:YOUR_PASS@YOUR_CLUSTER...";
mongoose.connect(mongoURI).then(() => console.log("✅ MongoDB Connected"));

// Định nghĩa Schema (Cấu trúc dữ liệu)
const UserSchema = new mongoose.Schema({
    username: String,
    envelopes: [{ value: Number, opened: Boolean }],
    hasOpenedAny: { type: Boolean, default: false },
    openedAt: String
});
const User = mongoose.model('User', UserSchema);

app.use(express.json());
app.use(express.static('public'));

const DENOMINATIONS = [2000, 5000, 10000, 20000];

app.post('/api/user-data', async (req, res) => {
    const { username } = req.body;
    let user = await User.findOne({ username: username.trim() });

    if (!user) {
        const envelopes = Array.from({ length: 5 }, () => ({
            value: DENOMINATIONS[Math.floor(Math.random() * DENOMINATIONS.length)],
            opened: false
        }));
        user = new User({ username: username.trim(), envelopes });
        await user.save();
    }
    res.json(user);
});

app.post('/api/open-envelope', async (req, res) => {
    const { username, index } = req.body;
    const user = await User.findOne({ username: username.trim() });

    if (!user || user.hasOpenedAny) return res.status(400).json({ error: "Lỗi hoặc đã bóc!" });

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    user.envelopes[index].opened = true;
    user.hasOpenedAny = true;
    user.openedAt = timeString;

    await user.save(); // Lưu vĩnh viễn vào Cloud
    res.json({ success: true, value: user.envelopes[index].value, openedAt: timeString });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));