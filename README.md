# ScrollStop — AI Powered UGC Ad Generator

AI destekli kisa form video reklam olusturucu. React Native (iOS, Android, Web).

---

## Gereksinimler (Sifirdan Kurulum — macOS)

Asagidaki adimlari **hic React Native kurulumu olmayan** bir Mac'te sirasiyla uygulayin.

### 1. Homebrew

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Kurulduktan sonra terminali kapatip acin veya:

```sh
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 2. Node.js (>= 22)

```sh
brew install node
```

Kontrol:

```sh
node -v   # v22.x.x veya ustu
npm -v
```

### 3. Watchman

React Native'in dosya degisikliklerini izlemesi icin gerekli:

```sh
brew install watchman
```

### 4. Xcode (iOS icin)

1. **App Store**'dan **Xcode** indirip kurun (15.x veya ustu)
2. Xcode'u acin, `Settings > Locations > Command Line Tools` altinda Xcode versiyonunu secin
3. iOS Simulator kurun: Xcode > `Settings > Platforms > + > iOS 18.x`

Xcode CLI tools kontrol:

```sh
xcode-select -p
# /Applications/Xcode.app/Contents/Developer cikmali
```

Eger cikti yoksa:

```sh
sudo xcode-select --install
```

### 5. CocoaPods

```sh
brew install cocoapods
```

Kontrol:

```sh
pod --version
```

### 6. Ruby (opsiyonel)

macOS varsayilan Ruby yeterli olmayabilir. `bundle install` hata verirse:

```sh
brew install ruby
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## Projeyi Kurma

### 1. Repoyu klonla

```sh
git clone https://github.com/erenozyurek/ScrollStop.git
cd ScrollStop
```

### 2. NPM bagimliklarini kur

```sh
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` flag'i peer dependency conflict'lerini onler.

### 3. iOS native bagimliliklari kur

```sh
cd ios
pod install
cd ..
```

> Hata alirsaniz `pod repo update` calistirip tekrar deneyin.

---

## Calistirma

### iOS (Simulator)

```sh
npm run ios
```

Bu komut:
- Metro bundler'i baslatir
- iOS projesini build eder
- Simulator'da uygulamayi acar

Belirli bir simulator secmek icin:

```sh
npx react-native run-ios --simulator="iPhone 16 Pro"
```

### Android (Emulator)

> Android Studio ve bir emulator kurulu olmalidir.

```sh
npm run android
```

### Web

```sh
npm run web
```

Tarayicida **http://localhost:3000** adresinde acilir.

Production build:

```sh
npm run web:build
```

---

## Sadece Metro Bundler baslatma

```sh
npm start
```

Cache temizleyerek baslatmak icin:

```sh
npm start -- --reset-cache
```

---

## Test Hesabi

Uygulama su an hardcoded test hesabiyla calisir:

| Alan  | Deger              |
|-------|--------------------|
| Email | erencan@gmail.com  |
| Sifre | 12345              |

---

## Proje Yapisi

```
ScrollStop/
├── App.tsx                      # Root component
├── index.js                     # Native entry point
├── index.web.js                 # Web entry point
├── webpack.config.js            # Web build config
├── src/
│   ├── theme/                   # Renk, tipografi, spacing
│   ├── context/AuthContext.tsx   # Auth state yonetimi
│   ├── navigation/              # Stack + Tab navigasyon
│   ├── components/common/       # Button, Card, Chip, TextInput
│   └── screens/
│       ├── auth/                # Welcome, Login, Signup
│       ├── home/                # Ana sayfa
│       ├── create/              # CreateAd, CaptionGenerator, Generating
│       ├── preview/             # Video onizleme
│       ├── projects/            # Proje listesi (filtreli)
│       ├── profile/             # Profil ve ayarlar
│       └── pricing/             # Fiyat planlari
├── ios/                         # iOS native proje
├── android/                     # Android native proje
└── web/                         # Web HTML template
```

---

## Sik Karsilasilan Sorunlar

### Metro "port 8081 already in use"

```sh
lsof -ti:8081 | xargs kill -9
npm start
```

### iOS build hatasi (pods eksik)

```sh
cd ios && pod install && cd ..
npm run ios
```

### "Unimplemented component: RNSScreenContent"

Native moduller linklenmemis:

```sh
cd ios && pod install && cd ..
npx react-native run-ios
```

### Feather ikonlari "?" olarak gorunuyor

Clean build yapin:

```sh
cd ios && pod install && cd ..
npx react-native run-ios
```

### Web build webpack hatasi

```sh
rm -rf web-build node_modules/.cache
npm run web
```

---

## Kullanilan Teknolojiler

- **React Native** 0.84.0
- **React** 19.2.3
- **TypeScript**
- **React Navigation** (Native Stack + Bottom Tabs)
- **react-native-web** (Web destegi)
- **react-native-vector-icons** (Feather icon set)
- **react-native-safe-area-context**
- **react-native-screens**
- **Webpack** (Web build)

---

## Lisans

Ozel proje — tum haklari saklidir.
