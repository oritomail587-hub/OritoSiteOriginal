const express = require('express');
const http = require('http');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

// Bellekte tutulan kullanıcılar ve içerikler veritabanı
const users = [
    { username: 'OritoDeveloper1', password: 'OritoDeveloperPassword587582', isAdmin: true }
];
const games = [];
const announcements = [];

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
                    if (result.status === 'success') {
                        resolve(result.proxy || result.hosting);
                    } else {
                        resolve(false);
                    }
                } catch (e) {
                    resolve(false);
                }
            });
        }).on('error', () => resolve(false));
    });
}

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
                body { 
                    background-color: #121212; 
                    color: #ffffff; 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                
                #vpn-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: #1a0000;
                    display: ${isUsingVpn ? 'flex' : 'none'};
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    text-align: center;
                }

                #vpn-container img {
                    max-width: 250px;
                    width: 80%;
                    margin-bottom: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 25px rgba(255, 0, 0, 0.6);
                }

                #vpn-container h2 { color: #ff4d4d; font-size: 2rem; margin: 10px 0; }
                #vpn-container p { color: #ffcccc; font-size: 1.1rem; }

                #play-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 99999;
                }

                #play-btn {
                    padding: 20px 40px;
                    background: #00ffcc;
                    color: #121212;
                    font-size: 1.5rem;
                    font-weight: bold;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    box-shadow: 0 0 30px rgba(0, 255, 204, 0.7);
                    transition: transform 0.2s, background 0.2s;
                }
                #play-btn:hover { background: #00b386; transform: scale(1.05); }

                #intro-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: #000;
                    display: ${isUsingVpn ? 'none' : 'flex'};
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 999;
                    transition: opacity 0.8s ease;
                }

                video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                .loader-box {
                    position: relative;
                    z-index: 1000;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 20px 40px;
                    border-radius: 10px;
                    border: 2px solid #00ffcc;
                    text-align: center;
                    box-shadow: 0 0 20px rgba(0, 255, 204, 0.5);
                }

                .spinner {
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border-left-color: #00ffcc;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px auto;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Giriş / Kayıt Paneli & Ana Ekran */
                .auth-box {
                    text-align: center;
                    background: #1e1e1e;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    border: 1px solid #333;
                    width: 380px;
                    z-index: 10;
                }

                h1 { color: #00ffcc; margin-bottom: 20px; font-size: 2rem; }
                .input-group { margin-bottom: 15px; text-align: left; }
                label { display: block; font-size: 0.9rem; margin-bottom: 5px; color: #aaa; }
                input, textarea {
                    width: 100%;
                    padding: 10px;
                    border-radius: 6px;
                    border: 1px solid #444;
                    background: #2a2a2a;
                    color: #fff;
                    box-sizing: border-box;
                    margin-bottom: 10px;
                }
                .form-btn {
                    width: 100%;
                    padding: 12px;
                    background: #00ffcc;
                    color: #121212;
                    border: none;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .form-btn:hover { background: #00b386; }
                .toggle-link {
                    margin-top: 15px;
                    font-size: 0.85rem;
                    color: #888;
                    cursor: pointer;
                }
                .toggle-link span { color: #00ffcc; text-decoration: underline; }
                #message { margin-top: 10px; font-size: 0.9rem; }

                /* Developer ve İçerik Paneli */
                #dashboard {
                    display: none;
                    width: 800px;
                    max-width: 95%;
                    background: #181818;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.7);
                    border: 1px solid #333;
                    z-index: 10;
                }
                .section-box {
                    background: #222;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-left: 4px solid #00ffcc;
                }
                .badge { background: #ff4d4d; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; }
            </style>
        </head>
        <body>

            <div id="play-overlay">
                <button id="play-btn" onclick="initAudioAndSite()">▶ SİTEYİ VE MÜZİĞİ BAŞLAT</button>
            </div>

            <div id="vpn-container">
                <audio id="vpnAudio" src="/VPN.mp3" loop></audio>
                <img src="/VPN.png" alt="VPN Tespit Edildi">
                <h2>Erişim Engellendi</h2>
                <p>Lütfen VPN veya proxy'yi kapatınız!</p>
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

            <!-- Giriş / Kayıt Olma Paneli (Tarayıcı şifre kaydetme özellikli form) -->
            <div class="auth-box" id="auth-container">
                <h1 id="form-title">Giriş Yap</h1>
                <!-- Tarayıcının şifre kaydetmesi için form autocomplete aktif bırakıldı -->
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

            <!-- Giriş Yapıldıktan Sonra Görünecek Ana Ekran / Developer Paneli -->
            <div id="dashboard">
                <h1 style="margin-top:0;">Hoş Geldin, <span id="logged-user" style="color:#00ffcc;"></span>! <span id="dev-badge" style="display:none;" class="badge">DEVELOPER</span></h1>
                
                <!-- Sadece Developer (OritoDeveloper1) Görünüm Paneli -->
                <div id="developer-panel" style="display:none;" class="section-box">
                    <h3 style="color:#00ffcc; margin-top:0;">⚡ Developer Yönetim Paneli</h3>
                    
                    <!-- Oyun Ekleme -->
                    <form onsubmit="addGame(event)">
                        <h4>Oyun Yükle / Başlık Oluştur</h4>
                        <input type="text" id="gameTitle" placeholder="Oyun Başlığı (Title)" required>
                        <input type="text" id="gameLink" placeholder="Oyun Linki veya Dosya Yolu" required>
                        <button type="submit" class="form-btn">Oyunu Yayınla</button>
                    </form>

                    <hr style="border-color: #444; margin: 20px 0;">

                    <!-- Duyuru / Blog Ekleme -->
                    <form onsubmit="addAnnouncement(event)">
                        <h4>Duyuru veya Blog Yayınla</h4>
                        <input type="text" id="annoTitle" placeholder="Duyuru Başlığı" required>
                        <textarea id="annoText" placeholder="Duyuru veya blog içeriğini yazın..." rows="3" required></textarea>
                        <button type="submit" class="form-btn">Duyuruyu Paylaş</button>
                    </form>
                </div>

                <!-- Herkesin Görebileceği Alan -->
                <div class="section-box">
                    <h3 style="color:#00ffcc; margin-top:0;">🎮 Yayınlanan Oyunlar</h3>
                    <div id="games-list">Henüz oyun eklenmemiş.</div>
                </div>

                <div class="section-box">
                    <h3 style="color:#00ffcc; margin-top:0;">📢 Duyurular ve Bloglar</h3>
                    <div id="announcements-list">Henüz duyuru yok.</div>
                </div>
            </div>

            <script>
                const video = document.getElementById('introVideo');
                const vpnAudio = document.getElementById('vpnAudio');
                const playOverlay = document.getElementById('play-overlay');
                const introContainer = document.getElementById('intro-container');
                const authContainer = document.getElementById('auth-container');
                const dashboard = document.getElementById('dashboard');
                const isVpnActive = ${isUsingVpn};

                function initAudioAndSite() {
                    playOverlay.style.display = 'none';
                    if (isVpnActive && vpnAudio) {
                        vpnAudio.volume = 1.0;
                        vpnAudio.play().catch(e => console.log("VPN ses hatası:", e));
                    } else if (video) {
                        video.muted = false;
                        video.volume = 1.0;
                        video.play().catch(e => console.log("Video ses hatası:", e));
                    }
                }

                if (video) {
                    video.onended = fadeOutIntro;
                    video.onerror = fadeOutIntro;
                }

                function fadeOutIntro() {
                    if (introContainer) {
                        introContainer.style.opacity = '0';
                        setTimeout(() => {
                            introContainer.remove();
                        }, 800);
                    }
                }

                let isLogin = true;
                function toggleForm() {
                    isLogin = !isLogin;
                    const title = document.getElementById('form-title');
                    const btn = document.getElementById('submit-btn');
                    const toggleInfo = document.getElementById('toggle-info');
                    const toggleText = document.getElementById('toggle-text');
                    const passInput = document.getElementById('password');
                    document.getElementById('message').innerText = '';

                    if (isLogin) {
                        title.innerText = "Giriş Yap";
                        btn.innerText = "Giriş Yap";
                        toggleInfo.innerText = "Hesabın yok mu?";
                        toggleText.innerText = "Kayıt Ol";
                        passInput.setAttribute('autocomplete', 'current-password');
                    } else {
                        title.innerText = "Kayıt Ol";
                        btn.innerText = "Kayıt Ol";
                        toggleInfo.innerText = "Zaten hesabın var mı?";
                        toggleText.innerText = "Giriş Yap";
                        passInput.setAttribute('autocomplete', 'new-password');
                    }
                }

                async function handleAuth(event) {
                    event.preventDefault();
                    const username = document.getElementById('username').value;
                    const password = document.getElementById('password').value;
                    const endpoint = isLogin ? '/api/login' : '/api/register';
                    const msgBox = document.getElementById('message');

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    const data = await response.json();
                    msgBox.style.color = data.success ? '#00ffcc' : '#ff4d4d';
                    msgBox.innerText = data.message;

                    if (data.success) {
                        setTimeout(() => {
                            authContainer.style.display = 'none';
                            dashboard.style.display = 'block';
                            document.getElementById('logged-user').innerText = data.username;
                            
                            if (data.isAdmin) {
                                document.getElementById('dev-badge').style.display = 'inline-block';
                                document.getElementById('developer-panel').style.display = 'block';
                            }
                            loadContent();
                        }, 600);
                    }
                }

                // Oyun ve Duyuru Verilerini Çekme ve Ekleme
                async function loadContent() {
                    const res = await fetch('/api/content');
                    const data = await res.json();
                    
                    // Oyunlar Listesi
                    const gamesList = document.getElementById('games-list');
                    if (data.games.length === 0) {
                        gamesList.innerHTML = '<p style="color:#888;">Henüz oyun eklenmemiş.</p>';
                    } else {
                        gamesList.innerHTML = data.games.map(g => \`
                            <div style="background:#2a2a2a; padding:10px; margin-bottom:8px; border-radius:6px;">
                                <strong style="color:#00ffcc;">\${g.title}</strong><br>
                                <a href="\${g.link}" target="_blank" style="color:#8af; font-size:0.9rem;">\${g.link}</a>
                            </div>
                        \`).join('');
                    }

                    // Duyurular Listesi
                    const annoList = document.getElementById('announcements-list');
                    if (data.announcements.length === 0) {
                        annoList.innerHTML = '<p style="color:#888;">Henüz duyuru veya blog yok.</p>';
                    } else {
                        annoList.innerHTML = data.announcements.map(a => \`
                            <div style="background:#2a2a2a; padding:10px; margin-bottom:8px; border-radius:6px;">
                                <strong style="color:#ffcc00;">\${a.title}</strong>
                                <p style="margin:5px 0 0 0; font-size:0.9rem; color:#ddd;">\${a.text}</p>
                            </div>
                        \`).join('');
                    }
                }

                async function addGame(event) {
                    event.preventDefault();
                    const title = document.getElementById('gameTitle').value;
                    const link = document.getElementById('gameLink').value;

                    await fetch('/api/add-game', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, link })
                    });

                    document.getElementById('gameTitle').value = '';
                    document.getElementById('gameLink').value = '';
                    loadContent();
                }

                async function addAnnouncement(event) {
                    event.preventDefault();
                    const title = document.getElementById('annoTitle').value;
                    const text = document.getElementById('annoText').value;

                    await fetch('/api/add-announcement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, text })
                    });

                    document.getElementById('annoTitle').value = '';
                    document.getElementById('annoText').value = '';
                    loadContent();
                }
            </script>
        </body>
        </html>
    `);
});

// Kayıt Ol API
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) {
        return res.json({ success: false, message: 'Bu kullanıcı adı zaten alınmış!' });
    }
    
    const isAdmin = (username === 'OritoDeveloper1' && password === 'OritoDeveloperPassword587582');
    users.push({ username, password, isAdmin });
    res.json({ success: true, username, isAdmin, message: 'Kayıt başarılı! Giriş yapılıyor...' });
});

// Giriş Yap API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Özel developer hesabı kontrolü
    let user = users.find(u => u.username === username && u.password === password);
    
    if (!user && username === 'OritoDeveloper1' && password === 'OritoPassword587582') {
        // Otomatik admin tanımlama
        user = { username: 'OritoDeveloper1', password: 'OritoDeveloperPassword587582', isAdmin: true };
        users.push(user);
    }

    if (!user || user.password !== password) {
        return res.json({ success: false, message: 'Kullanıcı adı veya şifre hatalı!' });
    }

    const isAdmin = (user.username === 'OritoDeveloper1' && user.password === 'OritoDeveloperPassword587582');
    res.json({ success: true, username: user.username, isAdmin, message: 'Giriş başarılı!' });
});

// İçerikleri Getir API
app.get('/api/content', (req, res) => {
    res.json({ games, announcements });
});

// Oyun Ekleme API
app.post('/api/add-game', (req, res) => {
    const { title, link } = req.body;
    if (title && link) {
        games.push({ title, link });
        return res.json({ success: true });
    }
    res.json({ success: false });
});

// Duyuru Ekleme API
app.post('/api/add-announcement', (req, res) => {
    const { title, text } = req.body;
    if (title && text) {
        announcements.push({ title, text });
        return res.json({ success: true });
    }
    res.json({ success: false });
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});