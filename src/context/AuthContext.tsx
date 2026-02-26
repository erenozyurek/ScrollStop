import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';

interface User {
  name: string;
  email: string;
  password: string;
  credits: number;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  login: () => false,
  signup: () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Registered users store
  const [users, setUsers] = useState<User[]>([
    {
      name: 'Erencan',
      email: 'erencan@gmail.com',
      password: '12345',
      credits: 30,
    },
  ]);

  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    const found = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );

    if (found) {
      setUser(found);
      return true;
    }

    Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
    return false;
  };

  const signup = (name: string, email: string, password: string): boolean => {
    const exists = users.find(
      u => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (exists) {
      Alert.alert('Signup Failed', 'An account with this email already exists.');
      return false;
    }

    const newUser: User = {
      name,
      email,
      password,
      credits: 10,
    };

    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        signup,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
