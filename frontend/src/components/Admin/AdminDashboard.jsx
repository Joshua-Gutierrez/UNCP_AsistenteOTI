import { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiHeadphones, FiKey, FiMail, FiMessageSquare, FiSettings, FiUsers, FiGitBranch, FiLogOut } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api/v1/admin';

const columns = [
  { key: 'atendido', title: 'Atendidos', accent: 'success' },
  { key: 'manual', title: 'Atención manual', accent: 'warning' },
  { key: 'solicitud_soporte', title: 'Necesitan soporte', accent: 'danger' },
];

function maskDni(dni) {
  const value = String(dni || '').replace(/\D/g, '');
  return value.length >= 4 ? `****${value.slice(-4)}` : '****';
}

function formatDate(date) {
  return date ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(date)) : 'Sin fecha';
}

function caseIcon(tipo) {
  const value = String(tipo || '').toLowerCase();
  if (value.includes('soporte') || value.includes('impres')) return <FiHeadphones aria-hidden="true" />;
  if (value.includes('correo') || value.includes('mail')) return <FiMail aria-hidden="true" />;
  return <FiKey aria-hidden="true" />;
}

function CaseCard({ caso, accent, showContact }) {
  const role = caso.rol || caso.tipo_usuario || 'Estudiante';
  const title = caso.titulo || caso.asunto || caso.mensaje || 'Consulta sin asunto';
  const dni = caso.dni || caso.usuario_dni;

  return (
    <article className={`dashboard-case dashboard-case--${accent}`}>
      <div className="dashboard-case__heading">
        <span className="dashboard-case__icon">{caseIcon(caso.tipo)}</span>
        <h3>{title}</h3>
      </div>
      <p className="dashboard-case__dni">DNI {maskDni(dni)}</p>
      <span className="dashboard-case__role">{role}</span>
      <div className="dashboard-case__actions">
        <button type="button" onClick={() => window.alert('La conversación estará disponible próximamente.')}>
          <FiMessageSquare aria-hidden="true" />
          Ver conversación
        </button>
        {showContact && <button type="button" onClick={() => window.alert('La opción de contacto estará disponible próximamente.')}>Contactar</button>}
      </div>
    </article>
  );
}

export default function AdminDashboard() {
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

  return (
    <div className={`admin-dashboard ${sidebarCollapsed ? 'admin-dashboard--sidebar-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar__top">
          <Link to="/admin" className="admin-brand"><strong>UNCP</strong><span>Asistente</span></Link>
          <button type="button" className="admin-sidebar__toggle" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'} title={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}>
            {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>
        <nav className="admin-nav" aria-label="Navegación de administración">
          <button type="button" className={`admin-nav__item ${view === 'messages' ? 'admin-nav__item--active' : ''}`} onClick={() => selectView('messages')}><FiMessageSquare /><span>Mensajes</span></button>
          <button type="button" className={`admin-nav__item ${view === 'profiles' ? 'admin-nav__item--active' : ''}`} onClick={() => selectView('profiles')}><FiUsers /><span>Perfiles</span></button>
          <button type="button" className="admin-nav__item" onClick={openEditor}><FiGitBranch /><span>Flujo de respuesta</span></button>
        </nav>
        <button type="button" className="admin-nav__item admin-nav__logout" onClick={logout}><FiLogOut /><span>Cerrar sesión</span></button>
      </aside>

      <main className="admin-dashboard__content">
        <header className="admin-dashboard__header"><div><p className="admin-eyebrow">Panel de administración</p><h1>{view === 'profiles' ? 'Perfiles registrados' : 'Bandeja de mensajes'}</h1></div><FiSettings aria-hidden="true" /></header>
        {error && <p className="admin-dashboard__error" role="alert">{error}</p>}
        {view === 'profiles' ? (
          <section className="profiles-panel">
            <div className="profiles-panel__header"><span>Usuarios creados</span><strong>{profiles.length}</strong></div>
            {profiles.length ? <div className="profiles-list">{profiles.map((profile) => (
              <article className="profile-row" key={profile.id}>
                <div className="profile-row__identity"><span className="profile-row__avatar">{profile.nombre?.charAt(0).toUpperCase() || '?'}</span><div><h2>{profile.nombre}</h2><p>{profile.email}</p></div></div>
                <div><span className="profile-row__label">DNI</span><strong>{maskDni(profile.dni)}</strong></div>
                <div><span className="profile-row__label">Registro</span><strong>{formatDate(profile.creado_en)}</strong></div>
                <span className={`profile-status ${profile.activo ? 'profile-status--active' : ''}`}>{profile.activo ? 'Activo' : 'Inactivo'}</span>
              </article>
            ))}</div> : <p className="dashboard-column__empty">No hay perfiles registrados.</p>}
          </section>
        ) : loading ? <p className="admin-dashboard__status">Cargando casos...</p> : (
          <div className="admin-dashboard__grid">
            {columns.map((column) => (
              <section className={`dashboard-column dashboard-column--${column.accent}`} key={column.key}>
                <h2><span className="dashboard-column__dot" />{column.title}<span className="dashboard-column__count">{cases[column.key].length}</span></h2>
                <div className="dashboard-column__cases">
                  {cases[column.key].length ? cases[column.key].map((caso) => <CaseCard key={caso.id} caso={caso} accent={column.accent} showContact={column.key !== 'atendido'} />) : <p className="dashboard-column__empty">No hay casos en esta bandeja.</p>}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}