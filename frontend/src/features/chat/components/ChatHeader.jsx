import uncpLogo from '../../../assets/logo_uncp.png';
import { FiRefreshCcw, FiInfo } from 'react-icons/fi';

export default function ChatHeader({ onReset, isCargando }) {
  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm px-4 py-3 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center p-1 shadow-sm">
            <img src={uncpLogo} alt="Logo UNCP" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 leading-tight">UNCP Soporte Universitario</h2>
            <p className="text-sm text-gray-500 hidden sm:block">Canal Oficial de Atención y Orientación</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            En Línea - 24/7
          </span>
          <button 
            onClick={onReset} 
            disabled={isCargando} 
            className="text-sm text-blue-700 bg-blue-50 px-3 min-h-[44px] rounded-md font-medium hover:bg-blue-100 transition flex items-center justify-center gap-1.5"
          >
            <FiRefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Consulta</span>
          </button>
          <a href="/seguimiento" className="text-sm text-gray-600 bg-gray-100 px-3 min-h-[44px] rounded-md font-medium hover:bg-gray-200 transition flex items-center justify-center gap-1.5">
            <FiInfo className="w-4 h-4" />
            <span className="hidden sm:inline">Seguimiento</span>
          </a>
        </div>
      </div>
    </div>
  );
}
