import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

let _setAuth = null;
let _authState = { isAuthenticated: false, user: null, token: null };

export function useAuth() {
  const [authState, setAuthState] = useState(_authState);

  useEffect(() => {
    _setAuth = setAuthState;
    loadStoredAuth();
    return () => { _setAuth = null; };
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('auth_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        const newState = { isAuthenticated: true, user, token };
        _authState = newState;
        setAuthState(newState);
      }
    } catch (e) {
      console.log('Load auth error', e);
    }
  };

  const login = async (token, user) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      const newState = { isAuthenticated: true, user, token };
      _authState = newState;
      setAuthState(newState);
    } catch (e) {
      console.log('Save auth error', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      const newState = { isAuthenticated: false, user: null, token: null };
      _authState = newState;
      setAuthState(newState);
    } catch (e) {
      console.log('Logout error', e);
    }
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    token: authState.token,
    login,
    logout,
  };
}
