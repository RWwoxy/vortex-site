const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// SUPABASE KALICI VERİTABANI BAĞLANTISI
const SUPABASE_URL = "https://dhzpvbmecmaukoxjnecc.supabase.co";
const SUPABASE_KEY = "sb_secret_5whLfogpF3mXuWa4mZf2PA_6XIxyvlU"; 

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// KAYIT OL
app.post('/api/register', async (req, res) => {
    try {
        const { username, email } = req.body;
        if (!username || !email) return res.status(400).json({ success: false, message: 'Lütfen tüm alanları doldurun!' });

        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users?or=(username.eq.${encodeURIComponent(username)},email.eq.${encodeURIComponent(email)})`, { headers });
        const existingUsers = await checkRes.json();

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Bu kullanıcı adı veya e-posta zaten var!' });
        }

        await fetch(`${SUPABASE_URL}/rest/v1/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ username, email })
        });

        res.json({ success: true, message: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatası!' });
    }
});

// GİRİŞ YAP
app.post('/api/login', async (req, res) => {
    try {
        const { username, email } = req.body;
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&email=eq.${encodeURIComponent(email)}`, { headers });
        const users = await checkRes.json();

        if (Array.isArray(users) && users.length > 0) {
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
app.get('/api/stats', async (req, res) => {
    try {
        const countRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id`, { headers });
        const users = await countRes.json();
        res.json({ totalUsers: Array.isArray(users) ? users.length : 0 });
    } catch (err) {
        res.json({ totalUsers: 0 });
    }
});

// ORTAK İÇERİKLER (OYUNLAR/YAZILIMLAR) - GET
app.get('/api/items', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/items?select=*`, { headers });
        const items = await response.json();
        res.json(Array.isArray(items) ? items : []);
    } catch (err) {
        res.json([]);
    }
});

// ORTAK İÇERİKLER (OYUNLAR/YAZILIMLAR) - POST
app.post('/api/items', async (req, res) => {
    try {
        const { title, img, link, category } = req.body;
        if (!title || !img || !link) return res.status(400).json({ success: false, message: 'Tüm alanları doldurun!' });

        const newItem = { id: Date.now(), title, img, link, category };
        await fetch(`${SUPABASE_URL}/rest/v1/items`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newItem)
        });

        res.json({ success: true, message: 'İçerik tüm kullanıcılar için başarıyla yayınlandı!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'İçerik eklenirken sunucu hatası oluştu!' });
    }
});

// İÇERİK SİLME (Sadece Yetkili Adminler İçin)
app.post('/api/items/delete', async (req, res) => {
    try {
        const { id, username, email } = req.body;

        // Adminlik Doğrulaması (NirvanaX ve ShadowX)
        const isAdmin = (username === 'NirvanaX' && email === 'sancaktaraydin66@gmail.com') ||
                        (username === 'ShadowX' && email === 'kadirrr13aydin@gmail.com');

        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Bu işlemi yapmaya yetkiniz yok!' });
        }

        await fetch(`${SUPABASE_URL}/rest/v1/items?id=eq.${id}`, {
            method: 'DELETE',
            headers
        });

        res.json({ success: true, message: 'İçerik başarıyla silindi!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Silme işlemi sırasında hata oluştu!' });
    }
});

// ORTAK TOPLULUK SOHBETİ - GET
app.get('/api/chat', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/chat?select=*&order=id.asc`, { headers });
        const chat = await response.json();

        const formattedChat = Array.isArray(chat) ? chat.map(c => ({
            username: c.username,
            message: c.message,
            isAdmin: c.is_admin
        })) : [];

        res.json(formattedChat);
    } catch (err) {
        res.json([]);
    }
});

// ORTAK TOPLULUK SOHBETİ - POST
app.post('/api/chat', async (req, res) => {
    try {
        const { username, message, isAdmin } = req.body;
        if (!username || !message) return res.status(400).json({ success: false });

        await fetch(`${SUPABASE_URL}/rest/v1/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ username, message, is_admin: isAdmin })
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// SUNUCUYU BAŞLAT
app.listen(PORT, () => {
    console.log(`>>> VORTEX SİSTEMİ AKTİF (Port: ${PORT})`);
});
