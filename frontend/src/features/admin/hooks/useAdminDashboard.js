import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api/v1/admin';
const columns = [
  { key: 'atendido', title: 'Atendidos', accent: 'emerald', dot: 'bg-emerald-500' },
  { key: 'manual', title: 'Manuales', accent: 'amber', dot: 'bg-amber-500' },
  { key: 'solicitud_soporte', title: 'Solicitud de Soporte', accent: 'rose', dot: 'bg-rose-500' },
];

export function useAdminDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState({ atendido: [], manual: [], solicitud_soporte: [] });
  const [profiles, setProfiles] = useState([]);
  const [view, setView] = useState('messages');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    let ws = null;

    async function loadCases() {
      try {
        const responses = await Promise.all(
          columns.map(({ key }) => fetch(`${API_BASE}/casos?estado=${key}`, { credentials: 'include' })),
        );
        if (responses.some((response) => response.status === 401)) {
          navigate('/admin/login', { replace: true });
          return;
        }
        if (responses.some((response) => !response.ok)) throw new Error('No se pudieron cargar los casos.');
        const values = await Promise.all(responses.map((response) => response.json()));
        if (active) setCases(Object.fromEntries(columns.map(({ key }, index) => [key, values[index]])));
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCases();

    function connectWebSocket() {
      // API_BASE is http://localhost:8000/api/v1/admin
      // WebSocket URL is ws://localhost:8000/api/v1/admin/ws/dashboard
      const wsUrl = API_BASE.replace(/^http/, 'ws') + '/ws/dashboard';
      ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.evento === 'nuevo_caso') {
            loadCases(); // Actualizar inmediatamente el dashboard
          }
        } catch (e) {
          console.error('Error procesando evento WebSocket', e);
        }
      };

      ws.onclose = () => {
        if (active) {
          setTimeout(connectWebSocket, 5000); // reconexión
        }
      };
    }

    connectWebSocket();

    return () => { 
      active = false; 
      if (ws) ws.close();
    };
  }, [navigate, refreshKey]);

  useEffect(() => {
    if (view !== 'profiles') return undefined;
    let active = true;
    fetch(`${API_BASE}/administradores`, { credentials: 'include' })
      .then((response) => {
        if (response.status === 401) {
          navigate('/admin/login', { replace: true });
          throw new Error('Sesión expirada');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos de superadministrador para ver esto.');
        }
        if (!response.ok) throw new Error('No se pudieron cargar los administradores.');
        return response.json();
      })
      .then((data) => { if (active) setProfiles(data); })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [navigate, view, refreshKey]);

  async function logout() {
    await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
    navigate('/admin/login', { replace: true });
  }

  function selectView(nextView) {
    setView(nextView);
    if (nextView === 'messages') setSidebarCollapsed(false);
  }

  function openEditor() {
    setSidebarCollapsed(true);
    navigate('/admin/editor', { state: { sidebarCollapsed: true } });
  }

  async function finalizarAtencion(casoId, nota_cierre) {
    try {
      const response = await fetch(`${API_BASE}/casos/${casoId}/finalizar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota_cierre }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Error al finalizar la atención');
      setRefreshKey(prev => prev + 1);
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  }

  async function toggleAdminStatus(adminId, activo) {
    try {
      const response = await fetch(`${API_BASE}/administradores/${adminId}/activo?activo=${activo}`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 403) throw new Error('Solo un superadministrador puede hacer esto.');
        throw new Error('Error al cambiar estado.');
      }
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  }

  async function createAdmin(adminData) {
    const response = await fetch(`${API_BASE}/administradores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(adminData)
    });
    if (!response.ok) {
      if (response.status === 403) throw new Error('Solo un superadministrador puede hacer esto.');
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al crear administrador.');
    }
    setRefreshKey(prev => prev + 1);
    return await response.json();
  }

  return {
    cases,
    profiles,
    view,
    sidebarCollapsed,
    loading,
    error,
    logout,
    selectView,
    openEditor,
    finalizarAtencion,
    toggleAdminStatus,
    createAdmin
  };
}
