import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'mentor' | 'mentee';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'mentor' | 'mentee', name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('AuthContext: Authorization header set to', axios.defaults.headers.common['Authorization']);
      try {
        const response = await axios.get('http://localhost:5000/api/auth/me');
        setUser(response.data.data.user);
        console.log('AuthContext: User loaded', response.data.data.user);
      } catch (error) {
        console.error('AuthContext: Error loading user', error);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
    } else {
      setUser(null);
      console.log('AuthContext: No token found, user set to null');
    }
    setLoading(false);
    console.log('AuthContext: Loading set to false');
  }, []);

  useEffect(() => {
    console.log('AuthContext: useEffect triggered, calling loadUser');
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password,
    });
    const { token } = response.data.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('AuthContext: Authorization header set to', axios.defaults.headers.common['Authorization']);
    await loadUser(); // Ensure user is loaded immediately after login
  };

  const register = async (email: string, password: string, role: 'mentor' | 'mentee', name: string) => {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      email,
      password,
      role,
      name,
    });
    const { token } = response.data.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('AuthContext: Authorization header set to', axios.defaults.headers.common['Authorization']);
    await loadUser(); // Ensure user is loaded immediately after registration
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 