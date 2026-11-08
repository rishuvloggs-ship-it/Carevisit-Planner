import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/apiClient';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [circles, setCircles] = useState([]);
  const [activeCircle, setActiveCircle] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('carevisit_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        const userData = res.data.data.user;
        const userCircles = res.data.data.circles || [];
        setUser(userData);
        setCircles(userCircles);

        const savedCircleId = localStorage.getItem('carevisit_active_circle_id');
        const matched = userCircles.find((c) => c._id === savedCircleId);
        if (matched) {
          setActiveCircle(matched);
        } else if (userCircles.length > 0) {
          setActiveCircle(userCircles[0]);
          localStorage.setItem('carevisit_active_circle_id', userCircles[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to authenticate session:', err);
      localStorage.removeItem('carevisit_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      localStorage.setItem('carevisit_token', res.data.data.token);
      toast.success(res.data.message || 'Welcome back!');
      await fetchCurrentUser();
      return true;
    }
    return false;
  };

  const register = async (name, email, password, phone) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    if (res.data?.success) {
      localStorage.setItem('carevisit_token', res.data.data.token);
      toast.success(res.data.message || 'Registration successful!');
      await fetchCurrentUser();
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('carevisit_token');
    localStorage.removeItem('carevisit_active_circle_id');
    setUser(null);
    setCircles([]);
    setActiveCircle(null);
    toast.success('Logged out safely');
  };

  const selectCircle = (circle) => {
    setActiveCircle(circle);
    localStorage.setItem('carevisit_active_circle_id', circle._id);
  };

  // Get current user's role in active circle
  const currentRole = activeCircle?.members?.find(
    (m) => (m.userId?._id || m.userId)?.toString() === user?._id?.toString()
  )?.role || 'Viewer';

  const isFamilyAdmin = currentRole === 'Family Admin';
  const isCaregiver = currentRole === 'Caregiver' || currentRole === 'Family Admin';
  const isViewer = currentRole === 'Viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        circles,
        activeCircle,
        setActiveCircle: selectCircle,
        currentRole,
        isFamilyAdmin,
        isCaregiver,
        isViewer,
        loading,
        login,
        register,
        logout,
        refreshUserData: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
