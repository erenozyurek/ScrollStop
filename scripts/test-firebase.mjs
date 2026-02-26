/**
 * Firebase bağlantı testi
 * Çalıştır: node --experimental-modules scripts/test-firebase.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';

// .env dosyasını oku
const envContent = readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
});

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
};

console.log('\n🔧 Firebase Config:');
console.log('  projectId:', firebaseConfig.projectId);
console.log('  authDomain:', firebaseConfig.authDomain);
console.log('  apiKey:', firebaseConfig.apiKey ? '✅ mevcut' : '❌ eksik');
console.log('  appId:', firebaseConfig.appId ? '✅ mevcut' : '❌ eksik');

// Test e-posta (rastgele, sonra silinecek)
const TEST_EMAIL = `test_${Date.now()}@scrollstop-test.com`;
const TEST_PASSWORD = 'TestPass123!';

async function runTests() {
  let testUser = null;

  try {
    // 1. Firebase App Init
    console.log('\n─── Test 1: Firebase App Init ───');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app başarıyla initialize edildi');

    const auth = getAuth(app);
    const db = getFirestore(app);

    // 2. Auth - Signup
    console.log('\n─── Test 2: Firebase Auth (Signup) ───');
    const credential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    testUser = credential.user;
    console.log('✅ Test kullanıcı oluşturuldu:', testUser.uid);

    // 3. Firestore - Write
    console.log('\n─── Test 3: Firestore Write ───');
    const userRef = doc(db, 'users', testUser.uid);
    await setDoc(userRef, {
      email: TEST_EMAIL,
      displayName: 'Test User',
      username: 'testuser',
      provider: 'email',
      subscriptionType: 'free',
      createdAt: serverTimestamp(),
    });
    console.log('✅ Firestore users koleksiyonuna yazıldı');

    // 4. Firestore - Read
    console.log('\n─── Test 4: Firestore Read ───');
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log('✅ Firestore\'dan okundu:', {
        email: data.email,
        displayName: data.displayName,
        subscriptionType: data.subscriptionType,
      });
    } else {
      console.log('❌ Firestore\'dan veri okunamadı');
    }

    // 5. Auth - Login
    console.log('\n─── Test 5: Firebase Auth (Login) ───');
    const loginCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log('✅ Login başarılı, uid:', loginCredential.user.uid);

    console.log('\n══════════════════════════════════');
    console.log('🎉 TÜM TESTLER BAŞARILI!');
    console.log('══════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ TEST HATASI:', error.code || error.message);
    console.error('  Detay:', error.message);
  } finally {
    // Cleanup — test verisini sil
    if (testUser) {
      try {
        const db = getFirestore();
        await deleteDoc(doc(db, 'users', testUser.uid));
        await deleteUser(testUser);
        console.log('🧹 Test kullanıcı ve Firestore verisi silindi\n');
      } catch (e) {
        console.log('⚠️  Cleanup sırasında hata (manuel silebilirsin):', e.message, '\n');
      }
    }
  }
}

runTests();
