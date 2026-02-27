import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile, getUserProfile, UserProfile } from './firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_API_KEY = 'AIzaSyC1lY7xNsMv_CksXxcxk_Z7ejY7HzWNkzc';

// ============================================================
// iOS: Tamamen REST API + AsyncStorage tabanlı auth
// Firebase JS SDK iOS'ta network hatası veriyor — SDK hiç kullanılmıyor
// ============================================================

const IDENTITY_TOOLKIT_URL = 'https://identitytoolkit.googleapis.com/v1';
const SECURE_TOKEN_URL = 'https://securetoken.googleapis.com/v1';
const IOS_AUTH_KEY = '@scrollstop_ios_auth';

interface IOSAuthData {
  uid: string;
  email: string;
  displayName: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp ms
}

// ---------- iOS Token Yönetimi ----------

const saveIOSAuth = async (data: IOSAuthData): Promise<void> => {
  await AsyncStorage.setItem(IOS_AUTH_KEY, JSON.stringify(data));
};

const getIOSAuth = async (): Promise<IOSAuthData | null> => {
  const raw = await AsyncStorage.getItem(IOS_AUTH_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
};

const clearIOSAuth = async (): Promise<void> => {
  await AsyncStorage.removeItem(IOS_AUTH_KEY);
};

const refreshIOSToken = async (refreshToken: string): Promise<IOSAuthData | null> => {
  try {
    const res = await fetch(
      `${SECURE_TOKEN_URL}/token?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      },
    );
    const data = await res.json();
    if (!res.ok) return null;

    // Mevcut auth verisini güncelle
    const existing = await getIOSAuth();
    const updated: IOSAuthData = {
      uid: data.user_id || existing?.uid || '',
      email: existing?.email || '',
      displayName: existing?.displayName || '',
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + parseInt(data.expires_in, 10) * 1000,
    };
    await saveIOSAuth(updated);
    return updated;
  } catch {
    return null;
  }
};

// ---------- iOS REST API ----------

const restSignUp = async (email: string, password: string) => {
  const res = await fetch(
    `${IDENTITY_TOOLKIT_URL}/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    const errCode = data.error?.message?.toLowerCase().replace(/_/g, '-') || 'unknown';
    throw { code: `auth/${errCode}`, message: data.error?.message || 'Signup failed' };
  }
  return data;
};

const restSignIn = async (email: string, password: string) => {
  const res = await fetch(
    `${IDENTITY_TOOLKIT_URL}/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    const errCode = data.error?.message?.toLowerCase().replace(/_/g, '-') || 'unknown';
    throw { code: `auth/${errCode}`, message: data.error?.message || 'Login failed' };
  }
  return data;
};

const restUpdateProfile = async (idToken: string, displayName: string) => {
  const res = await fetch(
    `${IDENTITY_TOOLKIT_URL}/accounts:update?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, displayName, returnSecureToken: true }),
    },
  );
  return res.json();
};

// ============================================================
// Public Auth Functions
// ============================================================

export const firebaseSignup = async (
  name: string,
  email: string,
  password: string,
): Promise<UserProfile> => {
  if (Platform.OS === 'ios') {
    const restResult = await restSignUp(email, password);
    await restUpdateProfile(restResult.idToken, name);

    // iOS auth verisini kaydet
    await saveIOSAuth({
      uid: restResult.localId,
      email,
      displayName: name,
      idToken: restResult.idToken,
      refreshToken: restResult.refreshToken,
      expiresAt: Date.now() + parseInt(restResult.expiresIn || '3600', 10) * 1000,
    });

    // SDK'ya da giriş yap → Firestore auth context'i senkronize et
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      // SDK hatası olsa bile REST başarılı — devam
    }

    const profile = await createUserProfile(restResult.localId, {
      displayName: name,
      email,
      provider: 'email',
    });

    return profile;
  }

  // Android / Web: SDK kullan
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });

  const profile = await createUserProfile(credential.user.uid, {
    displayName: name,
    email,
    provider: 'email',
  });

  return profile;
};

export const firebaseLogin = async (
  email: string,
  password: string,
): Promise<UserProfile> => {
  let uid: string;

  if (Platform.OS === 'ios') {
    const restResult = await restSignIn(email, password);
    uid = restResult.localId;

    // iOS auth verisini kaydet
    await saveIOSAuth({
      uid: restResult.localId,
      email: restResult.email,
      displayName: restResult.displayName || '',
      idToken: restResult.idToken,
      refreshToken: restResult.refreshToken,
      expiresAt: Date.now() + parseInt(restResult.expiresIn || '3600', 10) * 1000,
    });

    // SDK'ya da giriş yap → Firestore auth context'i senkronize et
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      // SDK hatası olsa bile REST başarılı — devam
    }
  } else {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    uid = credential.user.uid;
  }

  const profile = await getUserProfile(uid);
  if (!profile) {
    return await createUserProfile(uid, {
      displayName: 'User',
      email,
      provider: 'email',
    });
  }
  return profile;
};

export const firebaseLogout = async (): Promise<void> => {
  if (Platform.OS === 'ios') {
    await clearIOSAuth();
    try { await signOut(auth); } catch {}
  } else {
    await signOut(auth);
  }
};

// iOS + Android: Firebase SDK onAuthStateChanged kullan
// iOS'ta SDK signIn başarılı olursa bu da tetiklenir
// Başarısız olursa AsyncStorage'dan oturum kontrolü yapılır
export const subscribeToAuthChanges = (
  callback: (user: FirebaseUser | null) => void,
) => {
  if (Platform.OS === 'ios') {
    // Önce SDK listener'ı dene — inMemoryPersistence ile çalışabilir
    const unsubscribe = onAuthStateChanged(auth, async (sdkUser) => {
      if (sdkUser) {
        // SDK'da kullanıcı var — doğrudan kullan
        callback(sdkUser);
      } else {
        // SDK'da kullanıcı yok — AsyncStorage kontrol et
        const stored = await getIOSAuth();
        if (stored) {
          if (stored.expiresAt < Date.now()) {
            const refreshed = await refreshIOSToken(stored.refreshToken);
            if (!refreshed) {
              await clearIOSAuth();
              callback(null);
              return;
            }
          }
          // SDK signIn'i dene (Firestore için gerekli)
          try {
            // Token varsa SDK'ya giriş — email/password bilmiyoruz ama
            // signInWithCustomToken yok, bu yüzden fake user döndür
            callback({
              uid: stored.uid,
              email: stored.email,
              displayName: stored.displayName,
            } as unknown as FirebaseUser);
          } catch {
            callback(null);
          }
        } else {
          callback(null);
        }
      }
    });

    return unsubscribe;
  }

  // Android / Web
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// iOS için: kayıtlı auth verisini al
export const getIOSAuthData = getIOSAuth;

export const getFirebaseIdToken = async (): Promise<string | null> => {
  if (Platform.OS === 'ios') {
    const stored = await getIOSAuth();
    if (!stored) return null;

    if (stored.expiresAt < Date.now()) {
      const refreshed = await refreshIOSToken(stored.refreshToken);
      if (!refreshed) {
        await clearIOSAuth();
        return null;
      }
      return refreshed.idToken;
    }

    return stored.idToken;
  }

  const user = auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
};

// ============================================================
// Şifre değiştirme — iOS: REST API, Android: SDK
// ============================================================

export const changePassword = async (
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  if (Platform.OS === 'ios') {
    // 1. Mevcut şifre ile doğrula
    const signInResult = await restSignIn(email, currentPassword);
    // 2. Yeni şifreyi ayarla
    const res = await fetch(
      `${IDENTITY_TOOLKIT_URL}/accounts:update?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: signInResult.idToken,
          password: newPassword,
          returnSecureToken: true,
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      throw {
        code: `auth/${data.error?.message?.toLowerCase().replace(/_/g, '-') || 'unknown'}`,
        message: data.error?.message || 'Password change failed',
      };
    }
    // Token güncelle
    await saveIOSAuth({
      uid: signInResult.localId,
      email,
      displayName: signInResult.displayName || '',
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + parseInt(data.expiresIn || '3600', 10) * 1000,
    });
  } else {
    // Android / Web: SDK
    const { updatePassword, EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('Kullanıcı oturumu bulunamadı.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }
};

// ============================================================
// Kullanıcı adı (displayName) değiştirme
// ============================================================

export const changeDisplayName = async (newName: string): Promise<void> => {
  if (Platform.OS === 'ios') {
    const stored = await getIOSAuth();
    if (!stored) throw new Error('Oturum bulunamadı.');
    await restUpdateProfile(stored.idToken, newName);
    await saveIOSAuth({ ...stored, displayName: newName });
  } else {
    const user = auth.currentUser;
    if (!user) throw new Error('Kullanıcı oturumu bulunamadı.');
    await updateProfile(user, { displayName: newName });
  }
};
