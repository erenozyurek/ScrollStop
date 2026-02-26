import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================================
// Types — database.md şemasına birebir uyumlu
// ============================================================

// 1. Users
export interface UserProfile {
  uid: string;               // Document ID = Auth UID
  email: string;
  username: string;
  displayName: string;
  provider: string;          // 'email' | 'google'
  createdAt: Timestamp | null;
  subscriptionType: string;  // 'free' | 'pro' | 'premium'
}

// 2. Products
export interface Product {
  id: string;                // Document ID (auto)
  userId: string;
  productName: string;
  productImage: string;
  productDescription: string;
  productUrl: string;
  createdAt: Timestamp | null;
  lastUsedAt: Timestamp | null;
}

// 3. Captions
export interface Caption {
  id: string;                // Document ID (auto)
  userId: string;
  productId: string;
  text: string;
  createdAt: Timestamp | null;
}

// 4. Videos
export interface Video {
  id: string;                // Document ID (auto)
  userId: string;
  productId: string;
  videoUrl: string;
  status: 'processing' | 'rendering' | 'completed' | 'failed';
  createdAt: Timestamp | null;
}

// 5. AI Jobs
export interface AIJob {
  id: string;                // Document ID (auto)
  userId: string;
  jobType: 'caption' | 'video';
  status: 'pending' | 'processing' | 'success' | 'error';
  inputPayload: Record<string, any>;
  outputPayload: Record<string, any>;
  createdAt: Timestamp | null;
  completedAt: Timestamp | null;
}

// 6. Subscriptions
export interface Subscription {
  id: string;                // Document ID (auto)
  userId: string;
  planType: string;          // 'monthly_pro' | 'yearly_premium' vb.
  status: 'active' | 'canceled' | 'past_due';
  startDate: Timestamp | null;
  endDate: Timestamp | null;
}

// ============================================================
// Collection names
// ============================================================

const USERS = 'users';
const PRODUCTS = 'products';
const CAPTIONS = 'captions';
const VIDEOS = 'videos';
const AI_JOBS = 'ai_jobs';
const SUBSCRIPTIONS = 'subscriptions';

// ============================================================
// 1. Users
// ============================================================

export const createUserProfile = async (
  uid: string,
  data: { displayName: string; email: string; username?: string; provider?: string },
): Promise<UserProfile> => {
  const userRef = doc(db, USERS, uid);
  const profile: Omit<UserProfile, 'uid'> = {
    email: data.email,
    username: data.username || data.email.split('@')[0],
    displayName: data.displayName,
    provider: data.provider || 'email',
    createdAt: serverTimestamp() as Timestamp,
    subscriptionType: 'free',
  };

  await setDoc(userRef, profile);
  return { uid, ...profile };
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, USERS, uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) return null;
  return { uid: snapshot.id, ...snapshot.data() } as UserProfile;
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'username' | 'subscriptionType'>>,
): Promise<void> => {
  const userRef = doc(db, USERS, uid);
  await updateDoc(userRef, { ...data });
};

// ============================================================
// 2. Products
// ============================================================

export const createProduct = async (
  data: Omit<Product, 'id' | 'createdAt' | 'lastUsedAt'>,
): Promise<string> => {
  const ref = doc(collection(db, PRODUCTS));
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    lastUsedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getProduct = async (productId: string): Promise<Product | null> => {
  const ref = doc(db, PRODUCTS, productId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
};

export const getUserProducts = async (userId: string): Promise<Product[]> => {
  const q = query(
    collection(db, PRODUCTS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
};

export const updateProduct = async (
  productId: string,
  data: Partial<Pick<Product, 'productName' | 'productImage' | 'productDescription' | 'productUrl' | 'lastUsedAt'>>,
): Promise<void> => {
  const ref = doc(db, PRODUCTS, productId);
  await updateDoc(ref, { ...data });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await deleteDoc(doc(db, PRODUCTS, productId));
};

// ============================================================
// 3. Captions
// ============================================================

export const createCaption = async (
  data: Omit<Caption, 'id' | 'createdAt'>,
): Promise<string> => {
  const ref = doc(collection(db, CAPTIONS));
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getCaption = async (captionId: string): Promise<Caption | null> => {
  const ref = doc(db, CAPTIONS, captionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Caption;
};

export const getProductCaptions = async (productId: string): Promise<Caption[]> => {
  const q = query(
    collection(db, CAPTIONS),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Caption));
};

export const getUserCaptions = async (userId: string): Promise<Caption[]> => {
  const q = query(
    collection(db, CAPTIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Caption));
};

export const deleteCaption = async (captionId: string): Promise<void> => {
  await deleteDoc(doc(db, CAPTIONS, captionId));
};

// ============================================================
// 4. Videos
// ============================================================

export const createVideo = async (
  data: Omit<Video, 'id' | 'createdAt'>,
): Promise<string> => {
  const ref = doc(collection(db, VIDEOS));
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getVideo = async (videoId: string): Promise<Video | null> => {
  const ref = doc(db, VIDEOS, videoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Video;
};

export const getProductVideos = async (productId: string): Promise<Video[]> => {
  const q = query(
    collection(db, VIDEOS),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Video));
};

export const getUserVideos = async (userId: string): Promise<Video[]> => {
  const q = query(
    collection(db, VIDEOS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Video));
};

export const updateVideo = async (
  videoId: string,
  data: Partial<Pick<Video, 'videoUrl' | 'status'>>,
): Promise<void> => {
  const ref = doc(db, VIDEOS, videoId);
  await updateDoc(ref, { ...data });
};

export const deleteVideo = async (videoId: string): Promise<void> => {
  await deleteDoc(doc(db, VIDEOS, videoId));
};

// ============================================================
// 5. AI Jobs
// ============================================================

export const createAIJob = async (
  data: Omit<AIJob, 'id' | 'createdAt' | 'completedAt'>,
): Promise<string> => {
  const ref = doc(collection(db, AI_JOBS));
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    completedAt: null,
  });
  return ref.id;
};

export const getAIJob = async (jobId: string): Promise<AIJob | null> => {
  const ref = doc(db, AI_JOBS, jobId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AIJob;
};

export const getUserAIJobs = async (userId: string): Promise<AIJob[]> => {
  const q = query(
    collection(db, AI_JOBS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AIJob));
};

export const updateAIJob = async (
  jobId: string,
  data: Partial<Pick<AIJob, 'status' | 'outputPayload'>>,
): Promise<void> => {
  const ref = doc(db, AI_JOBS, jobId);
  await updateDoc(ref, {
    ...data,
    ...(data.status === 'success' || data.status === 'error'
      ? { completedAt: serverTimestamp() }
      : {}),
  });
};

// ============================================================
// 6. Subscriptions
// ============================================================

export const createSubscription = async (
  data: Omit<Subscription, 'id'>,
): Promise<string> => {
  const ref = doc(collection(db, SUBSCRIPTIONS));
  await setDoc(ref, { ...data });
  return ref.id;
};

export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  const q = query(
    collection(db, SUBSCRIPTIONS),
    where('userId', '==', userId),
    where('status', '==', 'active'),
    orderBy('startDate', 'desc'),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Subscription;
};

export const updateSubscription = async (
  subscriptionId: string,
  data: Partial<Pick<Subscription, 'status' | 'endDate'>>,
): Promise<void> => {
  const ref = doc(db, SUBSCRIPTIONS, subscriptionId);
  await updateDoc(ref, { ...data });
};
