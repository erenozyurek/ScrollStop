# 🗄️ Proje Veritabanı (Firestore) Şeması

Bu döküman, projenin veritabanı yapısını, koleksiyonları, içerdiği veri tiplerini ve koleksiyonlar arası ilişkileri tanımlar. Veri tekrarını önlemek amacıyla normalize edilmiş bir NoSQL referans yapısı kullanılmıştır.

---

## 👤 1. Users Koleksiyonu (`users`)
Sisteme kayıtlı kullanıcıların temel kimlik ve profil bilgilerini tutar.
* **Örnek Document ID:** `wHCa9DUzoDMybr8rZALF` *(Auto-ID / Auth UID)*

| Alan Adı | Veri Tipi | Açıklama |
| :--- | :--- | :--- |
| `email` | string | Kullanıcının e-posta adresi. |
| `username` | string | Sistemdeki benzersiz kullanıcı adı. |
| `displayName` | string | Ekranda görünecek ad/soyad. |
| 
| `provider` | string | Giriş yöntemi (örn: `google`, `email`). |
| `createdAt` | timestamp | Hesabın oluşturulma tarihi. |
| `subscriptionType` | string | Mevcut abonelik durumu (örn: `free`, `pro`). |

---

## 📦 2. Products Koleksiyonu (`products`)
Kullanıcıların sisteme eklediği veya üzerinde çalıştığı ürünlerin bilgilerini tutar.
* **Örnek Document ID:** `ShSsabREGEODmixWE6bl` *(Auto-ID)*

| Alan Adı | Veri Tipi | Açıklama |
| :--- | :--- | :--- |
| `userId` | string | Ürünü oluşturan kullanıcının ID'si. |
| `productName` | string | Ürünün adı. |
| `productImage` | string | Ürün görselinin URL'si. |
| `productDescription` | string | Ürünün açıklaması veya detayları. |
| `productUrl` | string | Ürünün orijinal kaynak linki. |
| `createdAt` | timestamp | Ürünün sisteme eklenme tarihi. |
| `lastUsedAt` | timestamp | Ürünle ilgili son işlem yapılan tarih. |

---

## 📝 3. Captions Koleksiyonu (`captions`)
Ürünler için üretilen metin, başlık veya alt yazı içeriklerini tutar.
* **Örnek Document ID:** `IKBLUZSdXhYm8UwXhvZ7` *(Auto-ID)*

| Alan Adı | Veri Tipi | Açıklama |
| :--- | :--- | :--- |
| `userId` | string | İçeriği üreten kullanıcının ID'si. |
| `productId` | string | İçeriğin ait olduğu ürünün ID'si. |
| `text` | string | Üretilen metin/altyazı içeriği. |
| `createdAt` | timestamp | Metnin oluşturulma tarihi. |

---

## 🎬 4. Videos Koleksiyonu (`videos`)
Ürünler için üretilen veya işlenen videoların bilgilerini tutar.
* **Örnek Document ID:** `SuG5DOu1kgSOvWS7YT26` *(Auto-ID)*

| Alan Adı | Veri Tipi | Açıklama |
| :--- | :--- | :--- |
| `userId` | string | Videoyu oluşturan kullanıcının ID'si. |
| `productId` | string | Videonun ait olduğu ürünün ID'si. |
| `videoUrl` | string | Oluşturulan videonun depolama (storage) linki. |
| `status` | string | `processing`, `rendering`, `completed`, `failed` |
| `createdAt` | timestamp | Videonun oluşturulma veya talep edilme tarihi. |

---

## 🤖 5. AI Jobs Koleksiyonu (`ai_jobs`)
Yapay zeka işlemlerinin (kuyruk/pipeline) durumunu takip eder. Asenkron işlemler için kritik bir koleksiyondur.
* **Örnek Document ID:** `Zhrqc3dwDma3rtYwQL0e` *(Auto-ID)*

| Alan Adı | Veri Tipi | Açıklama |
| :--- | :--- | :--- |
| `userId` | string | İşlemi başlatan kullanıcının ID'si. |
| `jobType` | string | İşlemin türü (`caption` veya `video`). |
| `status` | string | İşlemin durumu (örn: `pending`, `processing`, `success`, `error`). |
| `inputPayload` | map | Yapay zekaya gönderilen parametreler/veriler. |
| `outputPayload` | map | Yapay zekadan dönen sonuçlar veya hata detayları. |
| `createdAt` | timestamp | İşlemin kuyruğa alınma tarihi. |
| `completedAt` | timestamp | İşlemin tamamlanma (veya hata alma) tarihi. |

---

## 💰 6. Subscriptions Koleksiyonu (`subscriptions`)
Kullanıcıların abonelik, ödeme ve yetkilendirme (monetization) planlarını yönetir.
* **Örnek Document ID:** `ifQrkke3OH5U5wTjdp91` *(Auto-ID)*

| Alan Adı | Veri Tipi | Açıklama |
| :--- | :--- | :--- |
| `userId` | string | Aboneliğin sahibi olan kullanıcının ID'si. |
| `planType` | string | Plan seviyesi (örn: `monthly_pro`, `yearly_premium`). |
| `status` | string | Abonelik durumu (örn: `active`, `canceled`, `past_due`). |
| `startDate` | timestamp | Abonelik başlangıç tarihi. |
| `endDate` | timestamp | Abonelik bitiş veya yenilenme tarihi. |

---

## 🔄 Veritabanı İlişki Diyagramı (ERD)

Aşağıdaki diyagram, koleksiyonların birbirleriyle olan ilişkilerini gösterir. Ana merkezde `User` yer alır ve diğer tüm veriler bu kullanıcıya ve kullanıcının `Product`larına bağlıdır.

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : "creates (userId)"
    USERS ||--o{ SUBSCRIPTIONS : "has (userId)"
    USERS ||--o{ AI_JOBS : "triggers (userId)"
    USERS ||--o{ CAPTIONS : "generates (userId)"
    USERS ||--o{ VIDEOS : "generates (userId)"
    
    PRODUCTS ||--o{ CAPTIONS : "has (productId)"
    PRODUCTS ||--o{ VIDEOS : "has (productId)"

    USERS {
        string wHCa9DUzoDMybr8rZALF PK "User ID"
        string email
    }
    PRODUCTS {
        string ShSsabREGEODmixWE6bl PK "Product ID"
        string userId FK
    }
    CAPTIONS {
        string IKBLUZSdXhYm8UwXhvZ7 PK "Caption ID"
        string userId FK
        string productId FK
    }
    VIDEOS {
        string SuG5DOu1kgSOvWS7YT26 PK "Video ID"
        string userId FK
        string productId FK
    }
    AI_JOBS {
        string Zhrqc3dwDma3rtYwQL0e PK "Job ID"
        string userId FK
    }
    SUBSCRIPTIONS {
        string ifQrkke3OH5U5wTjdp91 PK "Subscription ID"
        string userId FK
    }