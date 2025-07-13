# Levo Kod App

JWT token ile kimlik doğrulama yapan, arama özellikli Node.js backend ve React frontend uygulaması.

## Proje Yapısı

```
levo-kod/
├── server.js              # Backend API server
├── package.json           # Backend bağımlılıkları
├── README.md             # Bu dosya
└── frontend/             # React frontend
    ├── package.json      # Frontend bağımlılıkları
    ├── public/           # Statik dosyalar
    └── src/              # React kaynak kodları
```

## Özellikler

- 🔐 JWT token ile kimlik doğrulama (1 yıl geçerlilik)
- 🔍 3 farklı arama kriteri: Nickname, Discord, Instagram
- ➕ Çoklu satır giriş ile toplu veri ekleme
- 📱 Modern ve responsive UI (Material-UI)
- 🏷️ Otomatik kategori sınıflandırması (klas/3dcim)
- 🔄 Backend ve frontend tamamen ayrı

## Kurulum

### Backend Kurulumu

```bash
# Backend bağımlılıklarını yükle
npm install

# Backend'i başlat (port 5000)
npm start
```

### Frontend Kurulumu

```bash
# Frontend klasörüne git
cd frontend

# Frontend bağımlılıklarını yükle
npm install

# Frontend'i başlat (port 3000)
npm start
```

## Kullanım

### 1. Backend'i Başlat
```bash
npm start
```
Backend http://localhost:5000 adresinde çalışacak.

### 2. Frontend'i Başlat
```bash
cd frontend
npm start
```
Frontend http://localhost:3000 adresinde çalışacak.

### 3. Test Token Al
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

## API Endpoints

- `POST /api/auth/login` - Giriş yapma
- `GET /api/data` - Tüm verileri getirme (JWT gerekli)
- `GET /api/data/search` - Arama yapma (JWT gerekli)
- `POST /api/data` - Tek kayıt ekleme (JWT gerekli)
- `POST /api/data/bulk` - Toplu veri ekleme (JWT gerekli)
- `GET /api/health` - Sağlık kontrolü

## Veri Ekleme Formatı

**2 çizgi formatı (klas kategorisi):**
```
82BLY-9JI1P-1LLCOQ - Masquerade02 verildi - ibrahimboz8 - Instagram
```

**3 çizgi formatı (3dcim kategorisi):**
```
LEVO210D73 - Filopatris verildi - filopatris - dc
```

## Teknolojiler

### Backend
- Node.js
- Express.js
- JWT (jsonwebtoken)
- bcryptjs
- CORS
- Helmet

### Frontend
- React 18
- Material-UI
- Axios
- React Router

## Geliştirme

### Backend Geliştirme
```bash
npm run dev  # Nodemon ile geliştirme modu
```

### Frontend Geliştirme
```bash
cd frontend
npm start    # React development server
```

## Production

### Backend
```bash
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

## Lisans

MIT 