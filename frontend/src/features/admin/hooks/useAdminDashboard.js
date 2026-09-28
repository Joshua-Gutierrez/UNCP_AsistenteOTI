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

  useEffect(() => {
    let active = true;

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
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    if (view !== 'profiles') return undefined;
    let active = true;
    fetch(`${API_BASE}/perfiles`, { credentials: 'include' })
      .then((response) => {
        if (response.status === 401) {
          navigate('/admin/login', { replace: true });
          throw new Error('Sesión expirada');
        }
        if (!response.ok) throw new Error('No se pudieron cargar los perfiles.');
        return response.json();
      })
      .then((data) => { if (active) setProfiles(data); })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [navigate, view]);

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

  return {
    cases,
    profiles,
    view,
    sidebarCollapsed,
    loading,
    error,
    logout,
    selectView,
    openEditor
  };
}
