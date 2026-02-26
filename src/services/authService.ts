import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  signInWithCustomToken,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile, getUserProfile, UserProfile } from './firestore';
import { Platform } from 'react-native';

const FIREBASE_API_KEY = 'AIzaSyC1lY7xNsMv_CksXxcxk_Z7ejY7HzWNkzc';

// ============================================================
// Firebase Auth REST API — iOS'ta SDK fetch sorunu bypass
// ============================================================
const IDENTITY_TOOLKIT_URL = 'https://identitytoolkit.googleapis.com/v1';

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
    throw { code: `auth/${data.error?.message?.toLowerCase().replace(/_/g, '-') || 'unknown'}`, message: data.error?.message || 'Signup failed' };
  }
  return data; // { idToken, email, refreshToken, localId, ... }
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
    throw { code: `auth/${data.error?.message?.toLowerCase().replace(/_/g, '-') || 'unknown'}`, message: data.error?.message || 'Login failed' };
  }
  return data; // { idToken, email, refreshToken, localId, displayName, ... }
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
// Auth Functions
// ============================================================

export const firebaseSignup = async (
  name: string,
  email: string,
  password: string,
): Promise<UserProfile> => {
  if (Platform.OS === 'ios') {
    // iOS: REST API kullan
    const restResult = await restSignUp(email, password);
    await restUpdateProfile(restResult.idToken, name);

    // Firestore'da profil oluştur
    const profile = await createUserProfile(restResult.localId, {
      displayName: name,
      email,
      provider: 'email',
    });

    // SDK auth state'i senkronize et — signIn ile token'ı set et
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (_) {
      // SDK sign-in başarısız olsa bile REST ile profil zaten oluştu
    }

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
    // iOS: REST API kullan
    const restResult = await restSignIn(email, password);
    uid = restResult.localId;

    // SDK auth state'i senkronize etmeye çalış
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (_) {
      // SDK hatası olsa bile REST başarılı — devam et
    }
  } else {
    // Android / Web: SDK kullan
    const credential = await signInWithEmailAndPassword(auth, email, password);
    uid = credential.user.uid;
  }

  // Firestore'dan profil çek
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
  await signOut(auth);
};

export const subscribeToAuthChanges = (
  callback: (user: FirebaseUser | null) => void,
) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
