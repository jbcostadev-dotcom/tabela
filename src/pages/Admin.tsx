import { useState, useEffect } from 'react';
import AdminLogin from '../components/AdminLogin';
import AdminPanel from '../components/AdminPanel';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');

    if (token && user) {
      try {
    const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api';
    const response = await fetch(`${API_BASE_URL}/admin/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
          setAdminUser(JSON.parse(user));
        } else {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
    setLoading(false);
  };

  const handleLogin = (token: string, admin: any) => {
    setIsAuthenticated(true);
    setAdminUser(admin);
    localStorage.setItem('admin_token', token);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminPanel onLogout={handleLogout} adminUser={adminUser} />;
}