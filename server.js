const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Proje klasöründeki dosyaları (resimler vb.) dış dünyaya açar
app.use(express.static(__dirname));

// Ana sayfa tasarımı (Mavi arka plan ve senin resmin)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>OritoTeamStudio</title>
            <style>
                body { 
                    background-color: #007acc; /* Canlı mavi arka plan */
                    color: #ffffff; 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding-top: 80px; 
                    margin: 0;
                }
                h1 { font-size: 2.5rem; margin-bottom: 10px; }
                .image-container {
                    margin-top: 30px;
                }
                img {
                    max-width: 400px;
                    width: 100%;
                    border-radius: 12px;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                }
            </style>
        </head>
        <body>
            <h1>OritoTeamStudio 🚀</h1>
            <p>Node.js ile kuruldu ve 7/24 aktif!</p>
            
            <div class="image-container">
                <!-- Dosya adını doğrudan buraya yazdık -->
                <img src="/BurdaOyunYok.png" alt="Orito Ekran Fotoğrafı">
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});