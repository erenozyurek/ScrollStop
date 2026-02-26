import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyC1lY7xNsMv_CksXxcxk_Z7ejY7HzWNkzc',
  authDomain: 'scrollstop-33da7.firebaseapp.com',
  projectId: 'scrollstop-33da7',
  storageBucket: 'scrollstop-33da7.firebasestorage.app',
  messagingSenderId: '263965967395',
  appId: '1:263965967395:web:d0cb92b768b50f2e8d9d96',
};

const app = initializeApp(firebaseConfig);

// iOS'ta persistence sorununu bypass etmek için platform bazlı seçim
let persistence;
try {
  persistence = getReactNativePersistence(AsyncStorage);
} catch (e) {
  console.warn('[Firebase] RN persistence failed, falling back to inMemory');
  persistence = inMemoryPersistence;
}

export const auth = initializeAuth(app, {
  persistence,
});

export const db = getFirestore(app);
export default app;
