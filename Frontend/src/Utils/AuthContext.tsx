import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Api, { AuthEvents } from '../Utils/Api';

interface User {
  Id: string;
  Email: string;
  Name: string;
}

interface AuthContextType {
  User: User | null;
  Token: string | null;
  Login: (Email: string, Password: string) => Promise<void>;
  Register: (Name: string, Email: string, Password: string) => Promise<void>;
  Logout: () => void;
  IsLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [User, SetUser] = useState<User | null>(null);
  const [Token, SetToken] = useState<string | null>(null);
  const [IsLoading, SetIsLoading] = useState(true);

  const Logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    SetToken(null);
    SetUser(null);
  };

  useEffect(() => {
    // Check for stored auth data on mount
    const StoredToken = localStorage.getItem('token');
    const StoredUser = localStorage.getItem('user');

    if (StoredToken && StoredUser) {
      SetToken(StoredToken);
      SetUser(JSON.parse(StoredUser));
    }
    SetIsLoading(false);

    // Listen for logout events from API interceptor
    AuthEvents.onLogout.add(Logout);
    return () => {
      AuthEvents.onLogout.delete(Logout);
    };
  }, []);

  const Login = async (Email: string, Password: string) => {
    const Response = await Api.post('/users/login', { Email, Password });
    const { token, user } = Response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    SetToken(token);
    SetUser(user);
  };

  const Register = async (Name: string, Email: string, Password: string) => {
    const Response = await Api.post('/users/register', { Name, Email, Password });
    const { token, user } = Response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    SetToken(token);
    SetUser(user);
  };

  return (
    <AuthContext.Provider value={{ User, Token, Login, Register, Logout, IsLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UseAuth = () => {
  const Context = useContext(AuthContext);
  if (!Context) {
    throw new Error('UseAuth must be used within an AuthProvider');
  }
  return Context;
};
