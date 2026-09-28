import { useEffect, useState } from 'react';
import { 
  FiChevronLeft, FiChevronRight, FiHeadphones, FiKey, FiMail, 
  FiMessageSquare, FiSettings, FiUsers, FiGitBranch, FiLogOut,
  FiSearch, FiDownload, FiRefreshCw, FiClock, FiCheckCircle, 
  FiAlertCircle, FiPhone, FiEye, FiActivity, FiExternalLink
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import uncpLogo from '../../../assets/logo_uncp.png';

const API_BASE = 'http://localhost:8000/api/v1/admin';

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

function CaseCard({ caso, columnKey }) {
  const role = caso.rol || caso.tipo_usuario || 'Estudiante';
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
        <span className={`text-[10px] px-2 py-0.5 rounded font-medium
          ${isAtendido ? 'bg-blue-50 text-blue-700' : 
            isManual ? 'bg-blue-50 text-blue-700' : 
            'bg-rose-50 text-rose-700'}`}>
          {role}
        </span>
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
        <div className="flex justify-between items-center text-[10px] font-semibold text-gray-500 mb-1">
          <span>{isSoporte ? 'TRÁMITE' : 'PROCEDIMIENTO'}</span>
          {isAtendido && <span className="text-emerald-600 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-full"><FiCheckCircle/> Autenticado OCR</span>}
          {isManual && <span className="text-amber-600 flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-full"><FiHeadphones/> Operador Asignado</span>}
          {isSoporte && <span className="text-rose-600 flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded-full">Espera: 8 min</span>}
        </div>
        <p className="font-medium text-gray-800 text-sm">{title}</p>
        
        {isManual && (
          <p className="text-gray-600 italic mt-1 relative pl-2 border-l-2 border-amber-300">
            "Por favor autorizar ampliación de vacante..."
          </p>
        )}
        {isAtendido && (
          <p className="text-gray-500 mt-1">Validación biométrica exitosa. Guía de matrícula enviada automáticamente al buzón del alumno.</p>
        )}
        {isSoporte && (
          <p className="text-gray-500 mt-1">Error al sincronizar actas finales en la plataforma institucional. Traba en cierre de ciclo.</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-2">
          {isAtendido && <span className="text-[10px] text-gray-400 flex items-center gap-1"><FiClock/> {timeAgo(caso.creado_en) || 'Hace 12 min'}</span>}
          {!isAtendido && <button className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition">Ver conversación</button>}
          {isAtendido && <button className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200 transition">Detalles</button>}
        </div>
        
        {isAtendido && (
          <button className="text-xs font-semibold text-white bg-[#093c2b] px-3 py-1.5 rounded-md hover:bg-[#062c1f] transition flex items-center gap-1 shadow-sm">
            <FiEye/> Ver conversación
          </button>
        )}
        {isManual && (
          <button className="text-xs font-semibold text-white bg-[#855318] px-3 py-1.5 rounded-md hover:bg-[#6b4213] transition flex items-center gap-1 shadow-sm">
            <FiPhone/> Contactar en Vivo
          </button>
        )}
        {isSoporte && (
          <button className="text-xs font-semibold text-white bg-[#093c2b] px-3 py-1.5 rounded-md hover:bg-[#062c1f] transition flex items-center gap-1 shadow-sm">
            <FiExternalLink/> Contactar
          </button>
        )}
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
    openEditor
  } = useAdminDashboard();

  return (
    <div className="flex h-screen bg-[#f4f7f9] font-sans text-gray-800 overflow-hidden">
      
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
                  placeholder="Buscar por DNI, correo institucional o código de ticket..." 
                  className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button className="px-3 py-1.5 text-xs font-semibold bg-[#093c2b] text-white rounded-lg shadow-sm">Todos (32)</button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition">Estudiantes (22)</button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition">Docentes (7)</button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition">Administrativos (3)</button>
              </div>
            </div>
          )}

          {view === 'messages' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                <p className="text-[10px] font-bold text-gray-500 tracking-wider mb-1.5">RESUELTOS POR BOT</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-[#093c2b]">24</span>
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
                  <span className="text-3xl font-bold text-amber-600">3</span>
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
                  <span className="text-3xl font-bold text-rose-600">5</span>
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
                <span className="font-semibold text-gray-700">Usuarios creados</span>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{profiles.length}</span>
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
                        <p className="text-xs text-gray-500">{profile.email}</p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-xs text-gray-400 block">DNI</span>
                      <strong className="text-gray-700 font-mono">{maskDni(profile.dni)}</strong>
                    </div>
                    <div className="text-sm">
                      <span className="text-xs text-gray-400 block">Registro</span>
                      <strong className="text-gray-700">{formatDate(profile.creado_en)}</strong>
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${profile.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {profile.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                )) : <div className="p-8 text-center text-gray-500 text-sm">No hay perfiles registrados.</div>}
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
                    {cases[column.key].length ? (
                      cases[column.key].map((caso) => (
                        <CaseCard key={caso.id} caso={caso} columnKey={column.key} />
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
    </div>
  );
}
