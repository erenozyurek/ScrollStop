import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Alert } from 'react-native';
import {
  firebaseLogin,
  firebaseSignup,
  firebaseLogout,
  subscribeToAuthChanges,
} from '../services/authService';
import { getUserProfile, UserProfile } from '../services/firestore';

// Ekranlara expose edilen User tipi
export interface User {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  subscriptionType: string;
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
const toUser = (profile: UserProfile): User => ({
  uid: profile.uid,
  displayName: profile.displayName,
  username: profile.username,
  email: profile.email,
  subscriptionType: profile.subscriptionType,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase Auth state listener — uygulama açıldığında oturum durumunu kontrol eder
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async firebaseUser => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUser(toUser(profile));
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
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
      const profile = await firebaseLogin(email, password);
      setUser(toUser(profile));
      return true;
    } catch (err: any) {
      const code = err.code || 'unknown';
      const message =
        code === 'auth/invalid-credential'
          ? 'Invalid email or password. Please try again.'
          : code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : code === 'auth/network-request-failed'
          ? `Network error. Code: ${code}\n\nDetail: ${err.message}\n\nCustomData: ${JSON.stringify(err.customData || {})}`
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
      const profile = await firebaseSignup(name, email, password);
      setUser(toUser(profile));
      return true;
    } catch (err: any) {
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
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUser(toUser(profile));
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
