import { useEffect, useState } from 'react';
import { 
  FiChevronLeft, FiChevronRight, FiHeadphones, FiKey, FiMail, 
  FiMessageSquare, FiSettings, FiUsers, FiGitBranch, FiLogOut,
  FiSearch, FiDownload, FiRefreshCw, FiClock, FiCheckCircle, 
  FiAlertCircle, FiPhone, FiEye, FiActivity, FiExternalLink, FiX, FiCpu, FiUser, FiPieChart
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import uncpLogo from '../../../assets/logo_uncp.png';

const API_BASE = 'http://localhost:8000/api/v1/admin';

function ChatHistoryModal({ caso, onClose }) {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/casos/${caso.id}/mensajes`, {credentials: 'include'})
      .then(r => r.json())
      .then(data => {
        setMensajes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [caso.id]);

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#f4f7f9] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="bg-white px-5 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-lg leading-tight">Historial de Conversación</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Ticket: {caso.codigo_ticket || `#${String(caso.id).substring(0,8).toUpperCase()}`} • DNI: {caso.dni || caso.usuario_dni || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center p-10"><FiRefreshCw className="animate-spin text-gray-400" size={24}/></div>
          ) : mensajes.length === 0 ? (
            <div className="text-center text-gray-400 py-10 text-sm">No se encontró historial para esta sesión.</div>
          ) : (
            mensajes.map((m, i) => {
              const isBot = m.remitente !== 'usuario';
              return (
                <div key={i} className={`flex gap-3 max-w-[85%] ${isBot ? 'self-start' : 'self-end flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isBot ? 'bg-[#093c2b] text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {isBot ? <FiCpu size={14}/> : <FiUser size={14}/>}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${isBot ? 'bg-white text-gray-700 rounded-tl-none border border-gray-100' : 'bg-[#093c2b] text-white rounded-tr-none'}`}>
                    {m.contenido.split('\\n').map((line, idx) => (
                      <span key={idx} className="block">{line}</span>
                    ))}
                    <div className={`text-[9px] mt-1.5 ${isBot ? 'text-gray-400' : 'text-emerald-200 text-right'}`}>
                      {new Date(m.creado_en).toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function NewAdminModal({ onClose, onCreate }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({ nombre, correo, password, rol });
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800">Nuevo Administrador</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <FiX size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Completo</label>
            <input required type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-[#093c2b] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Correo Electrónico</label>
            <input required type="email" value={correo} onChange={e => setCorreo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-[#093c2b] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-[#093c2b] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
            <select value={rol} onChange={e => setRol(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-[#093c2b] text-sm">
              <option value="admin">Administrador Regular</option>
              <option value="superadmin">Superadministrador</option>
            </select>
          </div>
          <button disabled={loading} type="submit" className="mt-4 bg-[#093c2b] text-white py-2.5 rounded-md font-medium hover:bg-[#062c1f] transition disabled:opacity-50 text-sm">
            {loading ? 'Creando...' : 'Crear Administrador'}
          </button>
        </form>
      </div>
    </div>
  );
}

function FinalizarModal({ onClose, onConfirm }) {
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(nota);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-700">Finalizar Atención</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <FiX size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Nota de Cierre (Opcional)</label>
            <textarea 
              value={nota} 
              onChange={e => setNota(e.target.value)} 
              placeholder="¿Qué se hizo para resolver el caso?" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-[#093c2b] text-sm resize-none h-20"
            />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-[#093c2b] text-white py-2.5 rounded-md font-medium hover:bg-[#062c1f] transition disabled:opacity-50 text-sm flex justify-center items-center gap-2">
            {loading ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
            Confirmar y Cerrar
          </button>
        </form>
      </div>
    </div>
  );
}

const columns = [
  { key: 'atendido', title: 'Atendidos', accent: 'emerald', dot: 'bg-emerald-500' },
  { key: 'manual', title: 'Manuales', accent: 'amber', dot: 'bg-amber-500' },
  { key: 'solicitud_soporte', title: 'Solicitud de Soporte', accent: 'rose', dot: 'bg-rose-500' },
];

function maskDni(dni) {
  const value = String(dni || '').replace(/\D/g, '');
  return value.length >= 4 ? `****${value.slice(-4)}` : '****';
}

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatDate(date) {
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(date));
}

function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  return formatDate(date);
}

function CaseCard({ caso, columnKey, onOpenChat, onFinalizarAtencion }) {
  const rawRole = caso.rol || caso.tipo_usuario || 'Estudiante';
  const role = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
  const title = caso.titulo || caso.asunto || caso.mensaje || 'Consulta sin asunto';
  const dni = caso.dni || caso.usuario_dni || 'Sin DNI';
  const name = caso.nombre || caso.usuario_nombre || 'Usuario';
  const initials = getInitials(name);
  const faculty = caso.facultad || 'Sin facultad';
  const email = caso.email || caso.usuario_email || 'Sin correo';
  
  const isAtendido = columnKey === 'atendido';
  const isManual = columnKey === 'manual';
  const isSoporte = columnKey === 'solicitud_soporte';

  return (
    <article className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4 mb-4">
      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
            ${isAtendido ? 'bg-[#093c2b] text-white' : 
              isManual ? 'bg-amber-200 text-amber-900' : 
              'bg-rose-100 text-rose-700'}`}>
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm leading-tight">{name}</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">DNI {maskDni(dni)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium
            ${isAtendido ? 'bg-blue-50 text-blue-700' : 
              isManual ? 'bg-blue-50 text-blue-700' : 
              'bg-rose-50 text-rose-700'}`}>
            {role}
          </span>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded uppercase border border-gray-100">
            {caso.codigo_ticket ? caso.codigo_ticket : `#${String(caso.id).substring(0, 8)}`}
          </span>
        </div>
      </div>

      <div className="text-xs text-gray-600 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <FiSettings className="shrink-0 text-gray-400" />
          <span className="truncate">{faculty}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiMail className="shrink-0 text-gray-400" />
          <span className="truncate">{email}</span>
        </div>
      </div>

      <div className={`rounded-lg p-3 text-xs flex flex-col gap-1.5
        ${isAtendido ? 'bg-blue-50/50' : 
          isManual ? 'bg-blue-50/50' : 
          'bg-blue-50/50'}`}>

        
        {caso.mensaje && (
          <p className="text-gray-600 italic mt-1 relative pl-2 border-l-2 border-blue-300">
            "{caso.mensaje}"
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-2">
        <span className="text-[10px] text-gray-400 flex items-center gap-1 min-w-fit shrink-0"><FiClock/> {timeAgo(caso.creado_en)}</span>
        
        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          {!isAtendido && (
            <button onClick={() => onOpenChat(caso)} className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition flex items-center gap-1 shadow-sm shrink-0">
              Ver conversación
            </button>
          )}
          
          {isAtendido && (
            <>
              <button onClick={() => alert('Próximamente: Detalles')} className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded-md hover:bg-gray-200 transition shrink-0">Detalles</button>
              <button onClick={() => onOpenChat(caso)} className="text-[11px] font-semibold text-white bg-[#093c2b] px-2.5 py-1.5 rounded-md hover:bg-[#062c1f] transition flex items-center gap-1 shadow-sm shrink-0">
                <FiEye/> Ver conversación
              </button>
            </>
          )}
          
          {isManual && (
            <>
              <button onClick={() => alert('Próximamente: Iniciar chat en vivo')} className="text-[11px] font-semibold text-white bg-[#855318] px-2.5 py-1.5 rounded-md hover:bg-[#6b4213] transition flex items-center gap-1 shadow-sm shrink-0">
                <FiPhone/> Contactar
              </button>
              <button onClick={onFinalizarAtencion} className="text-[11px] font-semibold text-white bg-[#093c2b] px-2.5 py-1.5 rounded-md hover:bg-[#062c1f] transition flex items-center gap-1 shadow-sm shrink-0">
                Finalizar Atención
              </button>
            </>
          )}
          
          {isSoporte && (
            <>
              <button onClick={() => alert('Próximamente: Iniciar contacto')} className="text-[11px] font-semibold text-white bg-[#093c2b] px-2.5 py-1.5 rounded-md hover:bg-[#062c1f] transition flex items-center gap-1 shadow-sm shrink-0">
                <FiExternalLink/> Contactar
              </button>
              <button onClick={onFinalizarAtencion} className="text-[11px] font-semibold text-white bg-[#093c2b] px-2.5 py-1.5 rounded-md hover:bg-[#062c1f] transition flex items-center gap-1 shadow-sm shrink-0">
                Finalizar Atención
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

import { useAdminDashboard } from '../hooks/useAdminDashboard';

export default function AdminDashboard() {
  const {
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
  } = useAdminDashboard();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaso, setSelectedCaso] = useState(null);
  const [isNewAdminModalOpen, setIsNewAdminModalOpen] = useState(false);
  const [finalizarCasoId, setFinalizarCasoId] = useState(null);

  const filterCase = (caso) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    const dni = caso.dni || caso.usuario_dni || '';
    const email = caso.email || caso.usuario_email || '';
    const name = caso.nombre || caso.usuario_nombre || '';
    const ticket = caso.codigo_ticket || caso.ticket || (caso.id ? String(caso.id).substring(0, 8).toUpperCase() : '');
    
    return (
      dni.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      name.toLowerCase().includes(term) ||
      ticket.toLowerCase().includes(term) ||
      ('#' + ticket.toLowerCase()).includes(term)
    );
  };

  const allCases = [...(cases.atendido || []), ...(cases.manual || []), ...(cases.solicitud_soporte || [])];
  const countRole = (roleStr) => allCases.filter(c => (c.rol || c.tipo_usuario || '').toLowerCase().includes(roleStr)).length;


  return (
    <div className="flex h-[100dvh] bg-[#f4f7f9] font-sans text-gray-800 overflow-hidden">
      
      <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-[72px] flex items-center px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center p-1 shadow-sm shrink-0">
              <img src={uncpLogo} alt="Logo UNCP" className="w-full h-full object-contain" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-sm font-bold leading-tight text-[#093c2b]">UNCP Asistente</span>
                <span className="text-[11px] text-gray-500">Plataforma Institucional</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {!sidebarCollapsed && <p className="text-[11px] font-bold text-gray-400 mb-3 tracking-wider">MÓDULOS DE GESTIÓN</p>}
          <nav className="flex flex-col gap-1.5">
            <button 
              onClick={() => selectView('messages')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'messages' ? 'bg-[#093c2b] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Bandeja de Mensajes"
            >
              <FiMessageSquare className={view === 'messages' ? 'text-emerald-400' : 'text-gray-400'} size={18} />
              {!sidebarCollapsed && <span>Bandeja de Mensajes</span>}
            </button>
            <button 
              onClick={() => selectView('profiles')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'profiles' ? 'bg-[#093c2b] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Perfiles de Usuarios"
            >
              <FiUsers className={view === 'profiles' ? 'text-emerald-400' : 'text-gray-400'} size={18} />
              {!sidebarCollapsed && <span>Perfiles de Usuarios</span>}
            </button>
            <button 
              onClick={openEditor}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50`}
              title="Flujo de Respuesta"
            >
              <FiGitBranch className="text-gray-400" size={18} />
              {!sidebarCollapsed && <span>Flujo de Respuesta</span>}
            </button>
            <button 
              onClick={() => selectView('reports')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'reports' ? 'bg-[#093c2b] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              title="Historial de Atenciones"
            >
              <FiClock className={view === 'reports' ? 'text-emerald-400' : 'text-gray-400'} size={18} />
              {!sidebarCollapsed && <span>Historial de Atenciones</span>}
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 mt-auto flex flex-col gap-4">
           <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full" title="Cerrar sesión">
            <FiLogOut className="text-gray-400" size={18} />
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
          {!sidebarCollapsed && <p className="text-[11px] font-medium text-gray-400 px-3">UNCP v2.4</p>}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        <header className="px-8 py-4 shrink-0 flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <h1 className="text-xl font-bold text-[#093c2b]">
              {view === 'profiles' ? 'Perfiles de Usuarios' : 'Bandeja de Gestión de Atenciones'}
            </h1>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition">
                <FiDownload size={15} /> Exportar Reporte
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-[#093c2b] rounded-lg shadow-sm hover:bg-[#062c1f] transition">
                <FiRefreshCw size={15} /> Actualizar Datos
              </button>
            </div>
          </div>
          
          {view === 'messages' && (
            <div className="flex flex-wrap items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex-1 flex items-center gap-2 px-2 text-gray-400 min-w-[250px]">
                <FiSearch size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por DNI, correo institucional o código de ticket..." 
                  className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button className="px-3 py-1.5 text-xs font-semibold bg-[#093c2b] text-white rounded-lg shadow-sm">Todos ({allCases.length})</button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition">Estudiantes ({countRole('estudiante')})</button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition">Docentes ({countRole('docente')})</button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition">Administrativos ({countRole('administrativo')})</button>
              </div>
            </div>
          )}

          {view === 'messages' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold text-gray-500 tracking-wider mb-1.5">RESUELTOS POR BOT</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-[#093c2b]">{cases.atendido?.length || 0}</span>
                  <span className="text-xs font-medium text-gray-500 mb-0.5">casos</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <FiActivity/> 88% efectividad IA <span className="font-normal text-gray-400 ml-1">hoy</span>
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 6v6.5c0 5.05 3.81 9.85 9 11.5 5.19-1.65 9-6.45 9-11.5V6l-9-4zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg>
                </div>
                <div className="absolute bottom-0 left-4 right-4 h-1 bg-emerald-600 rounded-t-md"></div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold text-gray-500 tracking-wider mb-1.5">EN ATENCIÓN MANUAL</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-amber-600">{cases.manual?.length || 0}</span>
                  <span className="text-xs font-medium text-gray-500 mb-0.5">en curso</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-amber-600 flex items-center gap-1">
                  <FiUsers/> 2 operadores activos
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                   <FiMessageSquare size={16} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold text-gray-500 tracking-wider mb-1.5">MESA DE AYUDA / OCR</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-rose-600">{cases.solicitud_soporte?.length || 0}</span>
                  <span className="text-xs font-medium text-gray-500 mb-0.5">pendientes</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <FiAlertCircle/> 1 caso con OCR trabado
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                  <FiExternalLink size={16} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold text-gray-500 tracking-wider mb-1.5">TIEMPO MEDIO RESPUESTA</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-gray-800">1.2</span>
                  <span className="text-xs font-medium text-gray-500 mb-0.5">min</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <FiActivity/> -45s vs promedio 2024
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <FiClock size={16} />
                </div>
                <div className="absolute bottom-0 left-4 right-4 h-1 bg-[#093c2b] rounded-t-md"></div>
              </div>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 text-sm flex items-center gap-2 border border-red-100">
              <FiAlertCircle size={18} /> {error}
            </div>
          )}

          {view === 'profiles' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div>
                  <span className="font-semibold text-gray-700">Administradores</span>
                  <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{profiles.length}</span>
                </div>
                <button onClick={() => setIsNewAdminModalOpen(true)} className="text-xs bg-[#093c2b] hover:bg-[#062c1f] text-white px-3 py-1.5 rounded-md font-medium transition">
                  + Nuevo Administrador
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {profiles.length ? profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                        {profile.nombre?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-800 text-sm">{profile.nombre}</h2>
                        <p className="text-xs text-gray-500">{profile.correo}</p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-xs text-gray-400 block">Rol</span>
                      <strong className="text-gray-700 font-mono capitalize">{profile.rol}</strong>
                    </div>
                    <div className="text-sm">
                      <span className="text-xs text-gray-400 block">Registro</span>
                      <strong className="text-gray-700">{formatDate(profile.creado_en)}</strong>
                    </div>
                    <div>
                      <button 
                        onClick={() => toggleAdminStatus(profile.id, !profile.activo)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${profile.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {profile.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                )) : <div className="p-8 text-center text-gray-500 text-sm">No hay administradores registrados.</div>}
              </div>
            </div>
          ) : view === 'reports' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col min-h-[400px]">
              <div className="flex flex-col items-center justify-center mb-8">
                <FiClock className="text-gray-300 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-700 mb-2">Historial de Atenciones</h2>
                <p className="text-gray-500 text-sm text-center max-w-md">Selecciona un rango de fechas para visualizar y exportar el detalle de las atenciones finalizadas (estudiante, ticket, nota de resolución, etc).</p>
              </div>
              
              <div className="flex gap-4 items-end mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 justify-center">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Fecha Inicio</label>
                  <input type="date" id="report_start" className="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#093c2b]" defaultValue={new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Fecha Fin</label>
                  <input type="date" id="report_end" className="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#093c2b]" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <button 
                  onClick={async () => {
                    const start = document.getElementById('report_start').value;
                    const end = document.getElementById('report_end').value;
                    if (!start || !end) return alert('Selecciona ambas fechas');
                    const btn = document.getElementById('btn-preview');
                    btn.innerText = 'Cargando...';
                    try {
                      const res = await fetch(`http://localhost:8000/api/v1/admin/reportes/atenciones?fecha_inicio=${start}&fecha_fin=${end}`, {
                        credentials: 'include'
                      });
                      const data = await res.json();
                      const tbody = document.getElementById('report_tbody');
                      if(data.length === 0) {
                        tbody.innerHTML = '<tr><td colSpan="7" className="text-center p-4 text-gray-500">No hay atenciones en este rango</td></tr>';
                      } else {
                        tbody.innerHTML = data.map(r => `
                          <tr class="border-b border-gray-50 hover:bg-gray-50">
                            <td class="p-3 text-xs font-medium text-gray-700">${r.codigo_ticket}</td>
                            <td class="p-3 text-xs text-gray-600">${r.usuario_nombre}</td>
                            <td class="p-3 text-xs text-gray-600">${r.usuario_dni}</td>
                            <td class="p-3 text-xs text-gray-600 max-w-[150px] truncate" title="${r.nota_cierre || ''}">${r.nota_cierre || '-'}</td>
                            <td class="p-3 text-xs text-gray-600">${r.admin_nombre}</td>
                            <td class="p-3 text-xs text-gray-600">${new Date(r.finalizado_en).toLocaleString('es-PE')}</td>
                            <td class="p-3 text-xs font-bold text-gray-700">${r.tiempo_minutos} min</td>
                          </tr>
                        `).join('');
                      }
                      document.getElementById('report_preview').classList.remove('hidden');
                    } catch (e) {
                      alert('Error al cargar reporte');
                    }
                    btn.innerText = 'Generar Vista Previa';
                  }}
                  id="btn-preview"
                  className="bg-gray-800 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-700 transition h-[38px]"
                >
                  Generar Vista Previa
                </button>
                <button 
                  onClick={() => {
                    const start = document.getElementById('report_start').value;
                    const end = document.getElementById('report_end').value;
                    if (!start || !end) return alert('Selecciona ambas fechas');
                    window.open(`http://localhost:8000/api/v1/admin/reportes/atenciones/exportar?fecha_inicio=${start}&fecha_fin=${end}`, '_blank');
                  }}
                  className="bg-[#093c2b] text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-[#062c1f] transition h-[38px]"
                >
                  Exportar a Excel
                </button>
              </div>

              <div id="report_preview" className="hidden w-full overflow-hidden border border-gray-200 rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="p-3 text-xs font-semibold">Ticket</th>
                        <th className="p-3 text-xs font-semibold">Estudiante</th>
                        <th className="p-3 text-xs font-semibold">DNI</th>
                        <th className="p-3 text-xs font-semibold">Nota Cierre</th>
                        <th className="p-3 text-xs font-semibold">Admin. a cargo</th>
                        <th className="p-3 text-xs font-semibold">Fecha Fin</th>
                        <th className="p-3 text-xs font-semibold">Demora (min)</th>
                      </tr>
                    </thead>
                    <tbody id="report_tbody" className="bg-white">
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-40 text-gray-500">
              <FiRefreshCw className="animate-spin mr-2" /> Cargando casos...
            </div>
          ) : (
            <div className="flex gap-6 h-full overflow-x-auto pb-4">
              {columns.map((column) => (
                <section key={column.key} className="flex-1 min-w-[340px] flex flex-col h-full bg-[#f8fafc] rounded-2xl border border-gray-100 p-3 shadow-sm">
                  <div className="flex items-center gap-2 px-2 py-3 mb-2 shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`}></span>
                    <h2 className="font-bold text-gray-800 text-[15px]">{column.title}</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-1">
                    {cases[column.key].filter(filterCase).length ? (
                      cases[column.key].filter(filterCase).map((caso) => (
                        <CaseCard key={caso.id} caso={caso} columnKey={column.key} onOpenChat={setSelectedCaso} onFinalizarAtencion={() => setFinalizarCasoId(caso.id)} />
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center p-4 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        No hay casos en esta bandeja.
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {selectedCaso && (
        <ChatHistoryModal caso={selectedCaso} onClose={() => setSelectedCaso(null)} />
      )}
      {isNewAdminModalOpen && (
        <NewAdminModal onClose={() => setIsNewAdminModalOpen(false)} onCreate={createAdmin} />
      )}
      {finalizarCasoId && (
        <FinalizarModal 
          onClose={() => setFinalizarCasoId(null)} 
          onConfirm={async (nota) => {
            const success = await finalizarAtencion(finalizarCasoId, nota);
            if (success) {
              toast.success('Atención finalizada correctamente');
              setFinalizarCasoId(null);
            }
          }} 
        />
      )}
      <Toaster position="top-right" />
    </div>
  );
}
