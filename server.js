const express = require('express');
const http = require('http');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

const users = [];

// Gerçek IP adresi üzerinden VPN/Proxy Kontrolü yapan yardımcı fonksiyon
function checkVpnIp(ip) {
    return new Promise((resolve) => {
        // Yerel testlerde (localhost / 127.0.0.1) VPN engeline takılmasın
        if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
            return resolve(false);
        }

        // ip-api.com üzerinden IP türünü sorgula (proxy, hosting, vpn kontrolü)
        const url = `http://ip-api.com/json/${ip}?fields=status,proxy,hosting`;
        
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.status === 'success') {
                        // Eğer IP bir Proxy/VPN veya Veri Merkezi (Hosting) IP'si ise true döner
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
    // Render/Cloudflare arkasındaki gerçek kullanıcı IP'sini al
    let clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;

    // IP'nin VPN/Proxy olup olmadığını kontrol et
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
                    overflow: hidden;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                
                /* VPN Engel Ekranı */
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

                #vpn-container h2 {
                    color: #ff4d4d;
                    font-size: 2rem;
                    margin: 10px 0;
                }

                #vpn-container p {
                    color: #ffcccc;
                    font-size: 1.1rem;
                }

                /* Açılış Videosu ve Yükleme Ekranı */
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

                /* Ana Giriş / Kayıt Paneli */
                #main-content {
                    display: none;
                    text-align: center;
                    background: #1e1e1e;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    border: 1px solid #333;
                    width: 350px;
                    z-index: 10;
                }

                h1 { color: #00ffcc; margin-bottom: 20px; font-size: 2rem; }
                .input-group { margin-bottom: 15px; text-align: left; }
                label { display: block; font-size: 0.9rem; margin-bottom: 5px; color: #aaa; }
                input {
                    width: 100%;
                    padding: 10px;
                    border-radius: 6px;
                    border: 1px solid #444;
                    background: #2a2a2a;
                    color: #fff;
                    box-sizing: border-box;
                }
                button {
                    width: 100%;
                    padding: 12px;
                    background: #00ffcc;
                    color: #121212;
                    border: none;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 10px;
                    transition: background 0.3s;
                }
                button:hover { background: #00b386; }
                .toggle-link {
                    margin-top: 15px;
                    font-size: 0.85rem;
                    color: #888;
                    cursor: pointer;
                }
                .toggle-link span { color: #00ffcc; text-decoration: underline; }
                #message { margin-top: 10px; font-size: 0.9rem; }
            </style>
        </head>
        <body>

            <!-- VPN / Proxy Uyarı Ekranı -->
            <div id="vpn-container">
                <img src="/VPN.png" alt="VPN Tespit Edildi">
                <h2>Erişim Engellendi</h2>
                <p>Lütfen VPN veya proxy'yi kapatınız!</p>
            </div>

            <!-- Açılış Videosu ve Yükleme Ekranı -->
            <div id="intro-container">
                <video id="introVideo" autoplay playsinline preload="auto">
                    <source src="/Start.mp4" type="video/mp4">
                </video>
                
                <div class="loader-box">
                    <div class="spinner"></div>
                    <div style="font-weight: bold; letter-spacing: 1px;">OYUN YÜKLENİYOR...</div>
                </div>
            </div>

            <!-- Giriş / Kayıt Olma Paneli -->
            <div id="main-content">
                <h1 id="form-title">Giriş Yap</h1>
                <form id="authForm" onsubmit="handleAuth(event)">
                    <div class="input-group">
                        <label>Kullanıcı Adı</label>
                        <input type="text" id="username" placeholder="Kullanıcı adınızı girin" required>
                    </div>
                    <div class="input-group">
                        <label>Şifre</label>
                        <input type="password" id="password" placeholder="Şifrenizi girin" required>
                    </div>
                    <button type="submit" id="submit-btn">Giriş Yap</button>
                </form>
                <div id="message"></div>
                <div class="toggle-link" onclick="toggleForm()">
                    <span id="toggle-info">Hesabın yok mu?</span> <span id="toggle-text">Kayıt Ol</span>
                </div>
            </div>

            <script>
                const video = document.getElementById('introVideo');
                const introContainer = document.getElementById('intro-container');
                const mainContent = document.getElementById('main-content');

                function playWithAudio() {
                    if (video) {
                        video.muted = false;
                        video.volume = 1.0;
                        video.play().catch(err => console.log("Ses hatası:", err));
                    }
                }

                window.addEventListener('load', playWithAudio);
                document.addEventListener('click', playWithAudio, { once: true });
                document.addEventListener('keydown', playWithAudio, { once: true });

                if (video) {
                    video.onended = fadeOutIntro;
                    video.onerror = fadeOutIntro;
                }

                function fadeOutIntro() {
                    if (introContainer) {
                        introContainer.style.opacity = '0';
                        setTimeout(() => {
                            introContainer.remove(); // Video bittiğinde tamamen silinir
                            mainContent.style.display = 'block';
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
                    document.getElementById('message').innerText = '';

                    if (isLogin) {
                        title.innerText = "Giriş Yap";
                        btn.innerText = "Giriş Yap";
                        toggleInfo.innerText = "Hesabın yok mu?";
                        toggleText.innerText = "Kayıt Ol";
                    } else {
                        title.innerText = "Kayıt Ol";
                        btn.innerText = "Kayıt Ol";
                        toggleInfo.innerText = "Zaten hesabın var mı?";
                        toggleText.innerText = "Giriş Yap";
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

                    if (data.success && isLogin) {
                        setTimeout(() => {
                            alert('Oyuna başarıyla giriş yapıldı!');
                        }, 500);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const existingUser = users.find(u => u.username === username);
    if (existingUser) return res.json({ success: false, message: 'Bu kullanıcı adı zaten var!' });
    users.push({ username, password });
    res.json({ success: true, message: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.json({ success: false, message: 'Kullanıcı adı veya şifre hatalı!' });
    res.json({ success: true, message: 'Giriş başarılı!' });
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});