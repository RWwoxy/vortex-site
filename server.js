const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const USERS_FILE = path.join(__dirname, 'users.txt');
const ITEMS_FILE = path.join(__dirname, 'items.json');
const CHAT_FILE = path.join(__dirname, 'chat.json');

if (!fs.existsSync(ITEMS_FILE)) {
    const defaultItems = []; // Örnek içerikler kaldırıldı, liste boş başlatılıyor
    fs.writeFileSync(ITEMS_FILE, JSON.stringify(defaultItems, null, 2), 'utf8');
}

if (!fs.existsSync(CHAT_FILE)) {
    const defaultChat = [
        { username: "NirvanaX", message: "Vortex Oyun Hizmetlerine hoş geldiniz!", isAdmin: true }
    ];
    fs.writeFileSync(CHAT_FILE, JSON.stringify(defaultChat, null, 2), 'utf8');
}

// KAYIT OL
app.post('/api/register', (req, res) => {
    try {
        const { username, email } = req.body;
        if (!username || !email) return res.status(400).json({ success: false, message: 'Lütfen tüm alanları doldurun!' });

        const data = fs.readFileSync(USERS_FILE, 'utf8');
        const lines = data.split('\n');
        const exists = lines.some(line => {
            const [u, e] = line.split('|');
            return u === username || e === email;
        });

        if (exists) return res.status(400).json({ success: false, message: 'Bu kullanıcı adı veya e-posta zaten var!' });

        fs.appendFileSync(USERS_FILE, `${username}|${email}\n`, 'utf8');
        res.json({ success: true, message: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});

// GİRİŞ YAP
app.post('/api/login', (req, res) => {
    try {
        const { username, email } = req.body;
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        const lines = data.split('\n');

        const user = lines.find(line => {
            const [u, e] = line.split('|');
            return u === username && e === email;
        });

        if (user) {
            let isAdmin = (username === 'NirvanaX' && email === 'sancaktaraydin66@gmail.com') ||
                          (username === 'ShadowX' && email === 'kadirrr13aydin@gmail.com');
            return res.json({ success: true, username, email, isAdmin });
        } else {
            return res.status(400).json({ success: false, message: 'Kullanıcı adı veya e-posta hatalı!' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});

// İSTATİSTİKLER
app.get('/api/stats', (req, res) => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        const count = data.trim().split('\n').filter(line => line.length > 0).length;
        res.json({ totalUsers: count });
    } catch (err) {
        res.json({ totalUsers: 0 });
    }
});

// ORTAK İÇERİKLER (OYUNLAR/YAZILIMLAR)
app.get('/api/items', (req, res) => {
    try {
        const data = fs.readFileSync(ITEMS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/items', (req, res) => {
    try {
        const { title, img, link, category } = req.body;
        if (!title || !img || !link) return res.status(400).json({ success: false, message: 'Tüm alanları doldurun!' });

        const items = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
        const newItem = { id: Date.now(), title, img, link, category };
        items.push(newItem);

        fs.writeFileSync(ITEMS_FILE, JSON.stringify(items, null, 2), 'utf8');
        res.json({ success: true, message: 'İçerik tüm kullanıcılar için başarıyla yayınlandı!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'İçerik eklenirken sunucu hatası oluştu!' });
    }
});

// ORTAK TOPLULUK SOHBETİ
app.get('/api/chat', (req, res) => {
    try {
        const data = fs.readFileSync(CHAT_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/chat', (req, res) => {
    try {
        const { username, message, isAdmin } = req.body;
        if (!username || !message) return res.status(400).json({ success: false });

        const chat = JSON.parse(fs.readFileSync(CHAT_FILE, 'utf8'));
        chat.push({ username, message, isAdmin });

        // Son 100 mesajı koru
        if (chat.length > 100) chat.shift();

        fs.writeFileSync(CHAT_FILE, JSON.stringify(chat, null, 2), 'utf8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});


app.listen(PORT, () => {
    console.log(`>>> VORTEX SİSTEMİ AKTİF (Port: ${PORT})`);
});

// İÇERİK SİLME (Sadece Yetkili Adminler İçin)
app.post('/api/items/delete', (req, res) => {
    try {
        const { id, username, email } = req.body;

        // Adminlik Doğrulaması (NirvanaX ve ShadowX)
        const isAdmin = (username === 'NirvanaX' && email === 'sancaktaraydin66@gmail.com') ||
                        (username === 'ShadowX' && email === 'kadirrr13aydin@gmail.com');

        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Bu işlemi yapmaya yetkiniz yok!' });
        }

        let items = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
        items = items.filter(item => item.id !== id);

        fs.writeFileSync(ITEMS_FILE, JSON.stringify(items, null, 2), 'utf8');
        res.json({ success: true, message: 'İçerik başarıyla silindi!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Silme işlemi sırasında hata oluştu!' });
    }
});
