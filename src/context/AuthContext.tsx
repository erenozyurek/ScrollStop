import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { Alert, Platform } from 'react-native';
import {
  firebaseLogin,
  firebaseSignup,
  firebaseLogout,
  subscribeToAuthChanges,
  getIOSAuthData,
} from '../services/authService';
import {
  getUserEntitlement,
  getUserProfile,
  UserEntitlement,
  UserProfile,
} from '../services/firestore';

// Ekranlara expose edilen User tipi
export interface User {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  plan: string;
  entitlementProvider: string;
  entitlementStatus: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  loading: true,
  login: async () => false,
  signup: async () => false,
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// UserProfile → UI User dönüşümü
const toUser = (
  profile: UserProfile,
  entitlement: UserEntitlement | null,
): User => ({
  uid: profile.uid,
  displayName: profile.displayName,
  username: profile.username,
  email: profile.email,
  plan: entitlement?.plan || 'free',
  entitlementProvider: entitlement?.provider || 'none',
  entitlementStatus: entitlement?.status || 'inactive',
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // iOS'ta login/signup sonrası auth listener'ın user'ı null yapmasını engelle
  const manualAuthRef = useRef(false);

  // Firebase Auth state listener — uygulama açıldığında oturum durumunu kontrol eder
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async firebaseUser => {
      // Manuel auth işlemi yapıldıysa (login/signup) listener'ı atla
      if (manualAuthRef.current) {
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        // iOS'ta SDK auth olmayabilir — önce SDK ile Firestore'u dene
        // Başarısız olursa AsyncStorage'daki veriyi kullan
        try {
          const [profile, entitlement] = await Promise.all([
            getUserProfile(firebaseUser.uid),
            getUserEntitlement(firebaseUser.uid),
          ]);
          if (profile) {
            setUser(toUser(profile, entitlement));
          } else {
            setUser({
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              username: firebaseUser.email?.split('@')[0] || 'user',
              email: firebaseUser.email || '',
              plan: entitlement?.plan || 'free',
              entitlementProvider: entitlement?.provider || 'none',
              entitlementStatus: entitlement?.status || 'inactive',
            });
          }
        } catch (err) {
          // Firestore permission hatası — iOS'ta SDK auth yok demek
          // AsyncStorage'daki temel veriyi kullan
          if (Platform.OS === 'ios') {
            const storedAuth = await getIOSAuthData();
            if (storedAuth) {
              setUser({
                uid: storedAuth.uid,
                displayName: storedAuth.displayName || 'User',
                username: storedAuth.email.split('@')[0],
                email: storedAuth.email,
                plan: 'free',
                entitlementProvider: 'none',
                entitlementStatus: 'inactive',
              });
            }
          } else {
            console.error('Failed to fetch user profile:', err);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      manualAuthRef.current = true;
      const profile = await firebaseLogin(email, password);
      const entitlement = await getUserEntitlement(profile.uid);
      setUser(toUser(profile, entitlement));
      return true;
    } catch (err: any) {
      manualAuthRef.current = false;
      const code = err.code || 'unknown';
      const message =
        code === 'auth/invalid-credential'
          ? 'Invalid email or password. Please try again.'
          : code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : code === 'auth/invalid-login-credentials'
          ? 'Invalid email or password. Please try again.'
          : err.message || 'Login failed. Please try again.';

      Alert.alert('Login Failed', message);
      return false;
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      manualAuthRef.current = true;
      const profile = await firebaseSignup(name, email, password);
      const entitlement = await getUserEntitlement(profile.uid);
      setUser(toUser(profile, entitlement));
      return true;
    } catch (err: any) {
      manualAuthRef.current = false;
      const message =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters.'
          : err.message || 'Signup failed. Please try again.';

      Alert.alert('Signup Failed', message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      manualAuthRef.current = false;
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const [profile, entitlement] = await Promise.all([
        getUserProfile(user.uid),
        getUserEntitlement(user.uid),
      ]);
      if (profile) {
        setUser(toUser(profile, entitlement));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        login,
        signup,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
