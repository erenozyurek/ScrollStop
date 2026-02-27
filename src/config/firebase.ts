import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  inMemoryPersistence,
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const { getReactNativePersistence } = require('firebase/auth');

const firebaseConfig = {
  apiKey: 'AIzaSyC1lY7xNsMv_CksXxcxk_Z7ejY7HzWNkzc',
  authDomain: 'scrollstop-33da7.firebaseapp.com',
  projectId: 'scrollstop-33da7',
  storageBucket: 'scrollstop-33da7.firebasestorage.app',
  messagingSenderId: '263965967395',
  appId: '1:263965967395:web:d0cb92b768b50f2e8d9d96',
};

const app = initializeApp(firebaseConfig);

// iOS: Auth SDK kullanılmıyor (REST API ile çalışıyor)
// Yine de initializeAuth gerekli çünkü diğer platformlar ve import'lar bliyor
// iOS'ta inMemoryPersistence ile minimal init — ağ bağlantısı yapmaz
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'ios'
    ? inMemoryPersistence
    : getReactNativePersistence(AsyncStorage),
});

// iOS: Firestore long polling kullan — WebChannel iOS RN'de çalışmıyor
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: Platform.OS === 'ios',
});
export default app;
