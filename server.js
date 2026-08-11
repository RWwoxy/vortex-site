const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Görsel yüklemelerinde boyuttan dolayı çökmemesi için limit artırıldı
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const USERS_FILE = path.join(__dirname, 'users.txt');

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '', 'utf8');
}

// Kayıt Ol
app.post('/api/register', (req, res) => {
    try {
        const { username, email } = req.body;
        if (!username || !email) {
            return res.status(400).json({ success: false, message: 'Lütfen tüm alanları doldurun!' });
        }

        const data = fs.readFileSync(USERS_FILE, 'utf8');
        const lines = data.split('\n');
        const exists = lines.some(line => {
            const [u, e] = line.split('|');
            return u === username || e === email;
        });

        if (exists) {
            return res.status(400).json({ success: false, message: 'Bu kullanıcı adı veya e-posta zaten sistemde var!' });
        }

        const newUserLine = `${username}|${email}\n`;
        fs.appendFileSync(USERS_FILE, newUserLine, 'utf8');

        res.json({ success: true, message: 'Vortex Ailesine Hoş Geldin! Şimdi giriş yapabilirsin.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatası oluştu!' });
    }
});

// Giriş Yap
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
            let isAdmin = false;
            if ((username === 'NirvanaX' && email === 'sancaktaraydin66@gmail.com') ||
                (username === 'ShadowX' && email === 'kadirrr13aydin@gmail.com')) {
                isAdmin = true;
            }
            return res.json({ success: true, username, email, isAdmin });
        } else {
            return res.status(400).json({ success: false, message: 'Kullanıcı adı veya e-posta hatalı!' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Sunucu hatası oluştu!' });
    }
});

// İstatistikler
app.get('/api/stats', (req, res) => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        const count = data.trim().split('\n').filter(line => line.length > 0).length;
        res.json({ totalUsers: count });
    } catch (err) {
        res.json({ totalUsers: 0 });
    }
});

app.listen(PORT, () => {
    console.log(`>>> VORTEX OYUN HİZMETLERİ AKTİF (Port: ${PORT})`);
});

