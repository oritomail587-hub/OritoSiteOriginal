const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

// Veri dosyaları
const USERS_FILE = path.join(__dirname, 'users.json');
const CONTENT_FILE = path.join(__dirname, 'content.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

function loadData(file, defaultData) {
    if (fs.existsSync(file)) {
        try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
        catch (e) { return defaultData; }
    }
    return defaultData;
}

function saveData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

let users = loadData(USERS_FILE, [
    { username: 'OritoDeveloper1', password: 'OritoDeveloperPassword587582', isAdmin: true }
]);
let siteContent = loadData(CONTENT_FILE, { games: [], announcements: [] });
let siteSettings = loadData(SETTINGS_FILE, { tadilat: false, saldiri: false });

function persistUsers() { saveData(USERS_FILE, users); }
function persistContent() { saveData(CONTENT_FILE, siteContent); }
function persistSettings() { saveData(SETTINGS_FILE, siteSettings); }

// VPN Kontrolü
function checkVpnIp(ip) {
    return new Promise((resolve) => {
        if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
            return resolve(false);
        }
        const url = `http://ip-api.com/json/${ip}?fields=status,proxy,hosting`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result.status === 'success' && (result.proxy || result.hosting));
                } catch (e) { resolve(false); }
            });
        }).on('error', () => resolve(false));
    });
}

// Ana Sayfa (Tadilat, Saldırı, Video İntro ve Giriş Paneli)
app.get('/', async (req, res) => {
    let clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;
    const isUsingVpn = await checkVpnIp(clientIp);

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>OritoTeamStudio</title>
            <style>
                body { background-color: #121212; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                
                .fullscreen-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    display: flex; flex-direction: column; justify-content: center; align-items: center;
                    z-index: 9999; text-align: center;
                }
                #vpn-container { background-color: #1a0000; display: ${isUsingVpn ? 'flex' : 'none'}; }
                #tadilat-container { background-color: #1a1a00; display: ${siteSettings.tadilat && !isUsingVpn ? 'flex' : 'none'}; }
                #saldiri-container { background-color: #330000; display: ${siteSettings.saldiri && !isUsingVpn ? 'flex' : 'none'}; }

                .fullscreen-overlay img { max-width: 300px; width: 80%; margin-bottom: 20px; border-radius: 10px; box-shadow: 0 0 25px rgba(255,0,0,0.6); }
                .fullscreen-overlay h2 { font-size: 2.5rem; margin: 10px 0; }

                #play-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: ${isUsingVpn || siteSettings.tadilat || siteSettings.saldiri ? 'none' : 'flex'}; flex-direction: column; justify-content: center; align-items: center; z-index: 99999; }
                #play-btn { padding: 20px 40px; background: #00ffcc; color: #121212; font-size: 1.5rem; font-weight: bold; border: none; border-radius: 10px; cursor: pointer; box-shadow: 0 0 30px rgba(0, 255, 204, 0.7); }
                #play-btn:hover { background: #00b386; transform: scale(1.05); }

                #intro-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #000; display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 999; transition: opacity 0.8s ease; }
                video { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; }
                .loader-box { position: relative; z-index: 1000; background: rgba(0,0,0,0.7); padding: 20px 40px; border-radius: 10px; border: 2px solid #00ffcc; text-align: center; }
                .spinner { border: 4px solid rgba(255,255,255,0.3); width: 40px; height: 40px; border-radius: 50%; border-left-color: #00ffcc; animation: spin 1s linear infinite; margin: 0 auto 15px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                .auth-box { text-align: center; background: #1e1e1e; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; width: 380px; z-index: 10; display: ${isUsingVpn || siteSettings.tadilat || siteSettings.saldiri ? 'none' : 'block'}; }
                h1 { color: #00ffcc; margin-bottom: 20px; font-size: 2rem; }
                .input-group { margin-bottom: 15px; text-align: left; }
                label { display: block; font-size: 0.9rem; margin-bottom: 5px; color: #aaa; }
                input, textarea, select { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #444; background: #2a2a2a; color: #fff; box-sizing: border-box; margin-bottom: 10px; }
                .form-btn { width: 100%; padding: 12px; background: #00ffcc; color: #121212; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.3s; }
                .form-btn:hover { background: #00b386; }
                .toggle-link { margin-top: 15px; font-size: 0.85rem; color: #888; cursor: pointer; }
                .toggle-link span { color: #00ffcc; text-decoration: underline; }
                #message { margin-top: 10px; font-size: 0.9rem; }

                #dashboard { display: none; width: 850px; max-width: 95%; background: #181818; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.7); border: 1px solid #333; z-index: 10; }
                .section-box { background: #222; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #00ffcc; }
                .badge { background: #ff4d4d; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; }
            </style>
        </head>
        <body>

            <div id="vpn-container" class="fullscreen-overlay">
                <audio src="/VPN.mp3" loop></audio>
                <img src="/VPN.png" alt="VPN">
                <h2 style="color:#ff4d4d;">Erişim Engellendi</h2>
                <p>Lütfen VPN veya proxy'yi kapatınız!</p>
            </div>

            <div id="tadilat-container" class="fullscreen-overlay">
                <img src="/Tadilat.png" alt="Tadilat">
                <h2 style="color:#ffcc00;">Site Tadilatta</h2>
                <p>Şu anda bakımdayız, yakında döneceğiz!</p>
            </div>

            <div id="saldiri-container" class="fullscreen-overlay">
                <img src="/saldırı.png" alt="Saldırı">
                <h2 style="color:#ff3333;">Güvenlik Modu Aktif</h2>
                <p>Sistem olağanüstü güvenlik tedbirleri altındadır.</p>
            </div>

            <div id="play-overlay">
                <button id="play-btn" onclick="startSite()">▶ SİTEYİ VE MÜZİĞİ BAŞLAT</button>
            </div>

            <div id="intro-container">
                <video id="introVideo" playsinline preload="auto">
                    <source src="/Start.mp4" type="video/mp4">
                </video>
                <div class="loader-box">
                    <div class="spinner"></div>
                    <div style="font-weight: bold; letter-spacing: 1px;">OYUN YÜKLENİYOR...</div>
                </div>
            </div>

            <div class="auth-box" id="auth-container">
                <h1 id="form-title">Giriş Yap</h1>
                <form id="authForm" onsubmit="handleAuth(event)">
                    <div class="input-group">
                        <label>Kullanıcı Adı</label>
                        <input type="text" id="username" name="username" autocomplete="username" placeholder="Kullanıcı adınızı girin" required>
                    </div>
                    <div class="input-group">
                        <label>Şifre</label>
                        <input type="password" id="password" name="password" autocomplete="current-password" placeholder="Şifrenizi girin" required>
                    </div>
                    <button type="submit" id="submit-btn" class="form-btn">Giriş Yap</button>
                </form>
                <div id="message"></div>
                <div class="toggle-link" onclick="toggleForm()">
                    <span id="toggle-info">Hesabın yok mu?</span> <span id="toggle-text">Kayıt Ol</span>
                </div>
            </div>

            <div id="dashboard">
                <h1 style="margin-top:0;">Hoş Geldin, <span id="logged-user" style="color:#00ffcc;"></span>! <span id="dev-badge" style="display:none;" class="badge">DEVELOPER</span></h1>
                
                <div id="developer-panel" style="display:none;" class="section-box">
                    <h3 style="color:#00ffcc; margin-top:0;">⚡ Developer Yönetim Paneli</h3>
                    
                    <div style="background:#111; padding:15px; border-radius:6px; margin-bottom:15px;">
                        <h4 style="margin-top:0; color:#ffcc00;">Sistem Modları</h4>
                        <label><input type="checkbox" id="chk-tadilat" onchange="toggleSetting('tadilat', this.checked)"> Tadilat Modu (Tadilat.png)</label><br>
                        <label><input type="checkbox" id="chk-saldiri" onchange="toggleSetting('saldiri', this.checked)"> Saldırı Modu (saldırı.png)</label>
                    </div>

                    <form onsubmit="addGame(event)" enctype="multipart/form-data">
                        <h4>Yeni Oyun Yayınla</h4>
                        <input type="text" id="gameName" placeholder="Oyun Adı (Örn: OritoAdventure)" required>
                        <input type="text" id="gameTitleText" placeholder="Oyun Title (Sekme Başlığı / Slogan)" required>
                        <textarea id="gameDesc" placeholder="Oyun Açıklaması..." rows="2" required></textarea>
                        
                        <label style="color:#aaa; font-size:0.85rem;">Kapak Görseli (.png):</label>
                        <input type="file" id="gameCover" accept=".png" required>

                        <label style="color:#aaa; font-size:0.85rem;">Tanıtım Videosu (.mp4):</label>
                        <input type="file" id="gameVideo" accept=".mp4" required>

                        <label style="color:#aaa; font-size:0.85rem;">Oyun Dosyası (.zip):</label>
                        <input type="file" id="gameZip" accept=".zip" required>

                        <button type="submit" class="form-btn">Oyunu Tamamen Yükle</button>
                    </form>

                    <hr style="border-color: #444; margin: 20px 0;">

                    <form onsubmit="addAnnouncement(event)">
                        <h4>Duyuru veya Blog Yayınla</h4>
                        <input type="text" id="annoTitle" placeholder="Duyuru Başlığı" required>
                        <textarea id="annoText" placeholder="İçerik..." rows="2" required></textarea>
                        <button type="submit" class="form-btn">Paylaş</button>
                    </form>
                </div>

                <div class="section-box">
                    <h3 style="color:#00ffcc; margin-top:0;">🎮 Yayınlanan Oyunlar</h3>
                    <div id="games-list">Yükleniyor...</div>
                </div>

                <div class="section-box">
                    <h3 style="color:#00ffcc; margin-top:0;">📢 Duyurular ve Bloglar</h3>
                    <div id="announcements-list">Yükleniyor...</div>
                </div>
            </div>

            <script>
                function startSite() {
                    document.getElementById('play-overlay').style.display = 'none';
                    const intro = document.getElementById('intro-container');
                    intro.style.display = 'flex';
                    const video = document.getElementById('introVideo');
                    video.muted = false;
                    video.volume = 1.0;
                    video.play().catch(e => console.log(e));

                    video.onended = () => {
                        intro.style.opacity = '0';
                        setTimeout(() => intro.remove(), 800);
                    };
                }

                let isLogin = true;
                function toggleForm() {
                    isLogin = !isLogin;
                    document.getElementById('form-title').innerText = isLogin ? "Giriş Yap" : "Kayıt Ol";
                    document.getElementById('submit-btn').innerText = isLogin ? "Giriş Yap" : "Kayıt Ol";
                    document.getElementById('toggle-info').innerText = isLogin ? "Hesabın yok mu?" : "Zaten hesabın var mı?";
                    document.getElementById('toggle-text').innerText = isLogin ? "Kayıt Ol" : "Giriş Yap";
                }

                async function handleAuth(event) {
                    event.preventDefault();
                    const username = document.getElementById('username').value;
                    const password = document.getElementById('password').value;
                    const endpoint = isLogin ? '/api/login' : '/api/register';
                    const msgBox = document.getElementById('message');

                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();
                    msgBox.style.color = data.success ? '#00ffcc' : '#ff4d4d';
                    msgBox.innerText = data.message;

                    if (data.success) {
                        setTimeout(() => {
                            document.getElementById('auth-container').style.display = 'none';
                            document.getElementById('dashboard').style.display = 'block';
                            document.getElementById('logged-user').innerText = data.username;
                            if (data.isAdmin) {
                                document.getElementById('dev-badge').style.display = 'inline-block';
                                document.getElementById('developer-panel').style.display = 'block';
                                fetchSettings();
                            }
                            loadContent();
                        }, 500);
                    }
                }

                async function fetchSettings() {
                    const res = await fetch('/api/settings');
                    const settings = await res.json();
                    document.getElementById('chk-tadilat').checked = settings.tadilat;
                    document.getElementById('chk-saldiri').checked = settings.saldiri;
                }

                async function toggleSetting(type, value) {
                    await fetch('/api/toggle-setting', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type, value })
                    });
                }

                async function loadContent() {
                    const res = await fetch('/api/content');
                    const data = await res.json();
                    
                    document.getElementById('games-list').innerHTML = data.games.length === 0 ? '<p style="color:#888;">Oyun yok.</p>' : data.games.map(g => \`
                        <div style="background:#2a2a2a; padding:12px; margin-bottom:10px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong style="color:#00ffcc; font-size:1.1rem;">\${g.title}</strong> (\${g.name})
                                <p style="margin:4px 0 0 0; font-size:0.85rem; color:#ccc;">\${g.desc}</p>
                            </div>
                            <a href="/\${g.name}" target="_blank" style="background:#00ffcc; color:#121212; padding:8px 15px; border-radius:5px; text-decoration:none; font-weight:bold;">Oyuna Git</a>
                        </div>
                    \`).join('');

                    document.getElementById('announcements-list').innerHTML = data.announcements.length === 0 ? '<p style="color:#888;">Duyuru yok.</p>' : data.announcements.map(a => \`
                        <div style="background:#2a2a2a; padding:10px; margin-bottom:8px; border-radius:6px;">
                            <strong style="color:#ffcc00;">\${a.title}</strong>
                            <p style="margin:5px 0 0 0; font-size:0.9rem; color:#ddd;">\${a.text}</p>
                        </div>
                    \`).join('');
                }

                async function addGame(event) {
                    event.preventDefault();
                    const formData = new FormData();
                    formData.append('name', document.getElementById('gameName').value);
                    formData.append('title', document.getElementById('gameTitleText').value);
                    formData.append('desc', document.getElementById('gameDesc').value);
                    formData.append('cover', document.getElementById('gameCover').files[0]);
                    formData.append('video', document.getElementById('gameVideo').files[0]);
                    formData.append('zip', document.getElementById('gameZip').files[0]);

                    const res = await fetch('/api/add-game', { method: 'POST', body: formData });
                    const data = await res.json();
                    if(data.success) {
                        alert('Oyun başarıyla yüklendi ve sayfası oluşturuldu!');
                        loadContent();
                    } else {
                        alert('Hata: ' + data.message);
                    }
                }

                async function addAnnouncement(event) {
                    event.preventDefault();
                    await fetch('/api/add-announcement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: document.getElementById('annoTitle').value, text: document.getElementById('annoText').value })
                    });
                    loadContent();
                }
            </script>
        </body>
        </html>
    `);
});

// Dinamik Oyun Sayfası Oluşturma (/(SiteIsmi)/(OyunIsmi))
app.get('/:gameName', (req, res) => {
    const gameName = req.params.gameName;
    const game = siteContent.games.find(g => g.name === gameName);

    if (!game) {
        return res.status(404).send('Oyun bulunamadı!');
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>${game.title}</title>
            <style>
                body { background-color: #121212; color: #fff; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 40px; display: flex; justify-content: center; }
                .game-container { background: #1e1e1e; padding: 30px; border-radius: 12px; width: 700px; max-width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.8); border: 1px solid #333; }
                h1 { color: #00ffcc; margin-top: 0; }
                img.cover { width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; border: 1px solid #444; }
                video.trailer { width: 100%; border-radius: 8px; margin-bottom: 20px; background: #000; }
                .download-btn { display: inline-block; padding: 15px 30px; background: #00ffcc; color: #121212; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 1.1rem; box-shadow: 0 0 15px rgba(0,255,204,0.4); }
                .download-btn:hover { background: #00b386; }
                p { color: #ccc; line-height: 1.5; }
            </style>
        </head>
        <body>
            <div class="game-container">
                <h1>${game.title}</h1>
                <img class="cover" src="${game.coverUrl}" alt="Kapak Görseli">
                
                <h3>Tanıtım Videosu</h3>
                <video class="trailer" controls autoplay muted>
                    <source src="${game.videoUrl}" type="video/mp4">
                    Tarayıcınız video etiketini desteklemiyor.
                </video>

                <h3>Açıklama</h3>
                <p>${game.desc}</p>

                <hr style="border-color:#444; margin: 25px 0;">

                <a class="download-btn" href="${game.zipUrl}" download>📥 Oyunu İndir (.ZIP)</a>
                <br><br>
                <a href="/" style="color:#8af; text-decoration:underline;">← Ana Sayfaya Dön</a>
            </div>
        </body>
        </html>
    `);
});

// API ve Dosya Yükleme İşlemleri
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) return res.json({ success: false, message: 'Bu kullanıcı adı zaten alınmış!' });
    const isAdmin = (username === 'OritoDeveloper1' && password === 'OritoDeveloperPassword587582');
    users.push({ username, password, isAdmin });
    persistUsers();
    res.json({ success: true, username, isAdmin, message: 'Kayıt başarılı!' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    let user = users.find(u => u.username === username && u.password === password);
    if (!user && username === 'OritoDeveloper1' && password === 'OritoDeveloperPassword587582') {
        user = { username: 'OritoDeveloper1', password: 'OritoDeveloperPassword587582', isAdmin: true };
        users.push(user);
        persistUsers();
    }
    if (!user || user.password !== password) return res.json({ success: false, message: 'Hatalı kullanıcı adı veya şifre!' });
    res.json({ success: true, username: user.username, isAdmin: (user.username === 'OritoDeveloper1'), message: 'Giriş başarılı!' });
});

app.get('/api/content', (req, res) => res.json(siteContent));
app.get('/api/settings', (req, res) => res.json(siteSettings));

app.post('/api/toggle-setting', (req, res) => {
    const { type, value } = req.body;
    if (type === 'tadilat') siteSettings.tadilat = value;
    if (type === 'saldiri') siteSettings.saldiri = value;
    persistSettings();
    res.json({ success: true });
});

// Oyun Dosyalarını (ZIP, PNG, MP4) Sunucuya Yükleme Middleware Basit Simülasyonu
// Gerçek projede Multer kullanılır, ancak tarayıcı yüklemesi için base64 veya upload dizini açılır.
// Kodun çalışması için /uploads klasörü oluşturulur.
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.post('/api/add-game', (req, res) => {
    // Basit metin tabanlı kayıt simülasyonu (Gerçek dosya yükleme için form-data multer gerekir)
    // Şimdilik örnek dosya linkleriyle kaydediyoruz:
    const { name, title, desc } = req.body;
    
    siteContent.games.push({
        name: name || 'oyun',
        title: title || 'Oyun Başlığı',
        desc: desc || 'Açıklama yok',
        coverUrl: '/VPN.png', // Örnek kapak
        videoUrl: '/Start.mp4', // Örnek video
        zipUrl: '#'
    });
    persistContent();
    res.json({ success: true });
});

app.post('/api/add-announcement', (req, res) => {
    const { title, text } = req.body;
    if (title && text) {
        siteContent.announcements.push({ title, text });
        persistContent();
        return res.json({ success: true });
    }
    res.json({ success: false });
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});