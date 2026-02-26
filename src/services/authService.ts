import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile, getUserProfile, UserProfile } from './firestore';

// ============================================================
// Auth Functions
// ============================================================

export const firebaseSignup = async (
  name: string,
  email: string,
  password: string,
): Promise<UserProfile> => {
  // Firebase Auth ile kullanıcı oluştur
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // Display name güncelle
  await updateProfile(credential.user, { displayName: name });

  // Firestore'da profil oluştur
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
  // Firebase Auth ile giriş yap
  const credential = await signInWithEmailAndPassword(auth, email, password);

  // Firestore'dan profil çek
  const profile = await getUserProfile(credential.user.uid);

  if (!profile) {
    // Firestore profili yoksa oluştur (eski kullanıcılar için fallback)
    return await createUserProfile(credential.user.uid, {
      displayName: credential.user.displayName || 'User',
      email: credential.user.email || email,
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
