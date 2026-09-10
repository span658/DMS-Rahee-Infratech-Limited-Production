import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState(() => localStorage.getItem('dms_selected_org_id') || '');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('dms_access_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('dms_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session validation failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { accessToken, refreshToken, user: userData } = res.data;
      localStorage.setItem('dms_access_token', accessToken);
      localStorage.setItem('dms_refresh_token', refreshToken);
      localStorage.setItem('dms_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
  };

  const logout = () => {
    try {
      api.post('/auth/logout').catch(() => {});
    } catch (e) {}
    localStorage.removeItem('dms_access_token');
    localStorage.removeItem('dms_refresh_token');
    localStorage.removeItem('dms_user');
    localStorage.removeItem('dms_selected_org_id');
    setUser(null);
    setSelectedOrgId('');
  };

  const switchOrganization = (orgId) => {
    setSelectedOrgId(orgId);
    if (orgId) {
      localStorage.setItem('dms_selected_org_id', orgId);
    } else {
      localStorage.removeItem('dms_selected_org_id');
    }
  };

  const hasPermission = (permissionCode) => {
    if (!user) return false;

    const permAliases = {
      'DOCUMENT_UPLOAD': 'upload',
      'DOCUMENT_PREVIEW': 'preview',
      'DOCUMENT_DOWNLOAD': 'download',
      'DOCUMENT_EDIT': 'edit',
      'DOCUMENT_REVIEW': 'approve_reject',
      'FINAL_APPROVAL': 'final_approve',
      'USER_CREATE': 'manage_users',
      'USER_DISABLE': 'manage_users',
      'REPORT_VIEW': 'view_reports',
      'AUDIT_LOG_VIEW': 'view_audit_logs',
      'MANAGE_FOLDERS': 'manage_folders',
      'FOLDER_CREATE': 'manage_folders'
    };

    const canonicalCode = permAliases[permissionCode] || permissionCode;

    if (user.is_super_admin) {
      if (canonicalCode === 'upload' || canonicalCode === 'edit') return false;
      return true;
    }

    if (!user.permissions) return false;
    return user.permissions.includes(canonicalCode);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      hasPermission,
      selectedOrgId,
      switchOrganization
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
