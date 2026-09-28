import uncpLogo from '../../../assets/logo_uncp.png';
import { FiRefreshCcw, FiSettings, FiInfo } from 'react-icons/fi';

export default function ChatHeader({ onReset, isCargando }) {
  return (
    <>
      {/* Top App Header Wrapper - Full Width */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center p-1 shadow-sm">
              <img src={uncpLogo} alt="Logo UNCP" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 leading-tight">UNCP Soporte Universitario</h2>
              <p className="text-xs text-gray-500 hidden sm:block">Canal Oficial de Atención y Orientación</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              En Línea - 24/7
            </span>
            <button 
              onClick={onReset} 
              disabled={isCargando} 
              className="text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md font-medium hover:bg-blue-100 transition flex items-center gap-1.5"
            >
              <FiRefreshCcw className="w-3.5 h-3.5" />
              Nueva Consulta
            </button>
            <a href="/admin" className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md font-medium hover:bg-gray-200 transition flex items-center gap-1.5">
              <FiSettings className="w-3.5 h-3.5" />
              Admin
            </a>
          </div>
        </div>
      </div>

      {/* Main Chat Area Centered - inner header */}
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-100 rounded-t-xl sm:rounded-t-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center relative p-1 shadow-sm">
            <img src={uncpLogo} alt="Logo UNCP" className="w-full h-full object-contain" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-base sm:text-lg text-gray-800">Asistente Virtual Institucional</h1>
            <span className="text-[10px] font-bold text-[#b48e4b] bg-[#fdf8e7] border border-[#f5e3b5] px-2 py-0.5 rounded-full flex items-center gap-1">
              ✓ Oficial UNCP
            </span>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition">
          <FiInfo className="w-5 h-5" />
        </button>
      </header>
    </>
  );
}
