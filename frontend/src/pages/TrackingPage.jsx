import { useState } from 'react';
import { FiSearch, FiArrowLeft, FiClock, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TrackingPage() {
  const [dni, setDni] = useState('');
  const [ticket, setTicket] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!dni.trim() || !ticket.trim()) {
      toast.error('Ingrese DNI y número de ticket');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/chat/seguimiento?dni=${encodeURIComponent(dni)}&ticket=${encodeURIComponent(ticket)}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('No encontramos una solicitud con esos datos.');
        }
        throw new Error('Error al consultar el seguimiento.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado) => {
    if (estado === 'finalizado') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (estado === 'atendido') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (estado === 'manual') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] flex flex-col items-center p-4">
      <div className="w-full max-w-md mt-10">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition"
        >
          <FiArrowLeft className="mr-2" /> Volver al chat
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Seguimiento de Trámite</h1>
            <p className="text-sm text-gray-500 mt-2">
              Consulta el estado de tu solicitud ingresando tu DNI y el código de ticket proporcionado por el asistente.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
              <input
                type="text"
                value={dni}
                onChange={e => setDni(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#093c2b] focus:border-[#093c2b] outline-none transition"
                placeholder="Ej. 76543210"
                maxLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de Ticket</label>
              <input
                type="text"
                value={ticket}
                onChange={e => setTicket(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#093c2b] focus:border-[#093c2b] outline-none transition uppercase"
                placeholder="Ej. UNCP-A3F9"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#093c2b] text-white font-medium py-2.5 rounded-lg hover:bg-[#062c1f] transition flex justify-center items-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <span className="animate-pulse">Consultando...</span> : <><FiSearch /> Consultar Estado</>}
            </button>
          </form>

          {result && (
            <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Hoja de Ruta</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(result.estado)}`}>
                  {result.estado.toUpperCase()}
                </span>
              </div>
              
              <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[7px] before:w-0.5 before:bg-gray-200">
                
                {/* Paso 1: Creación */}
                <div className="relative">
                  <div className="absolute -left-[11px] top-1 h-3 w-3 rounded-full bg-[#093c2b] ring-4 ring-white" />
                  <div className="pl-6">
                    <h4 className="text-sm font-bold text-gray-800">Dependencia Inicio: Asistente Virtual UNCP</h4>
                    <p className="text-xs text-gray-500 mt-1">Estado: Ingresado al sistema</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <FiClock size={12} /> {new Date(result.creado_en).toLocaleString('es-PE')}
                    </p>
                  </div>
                </div>

                {/* Paso 2: Derivado a Admin */}
                {(result.estado === 'manual' || result.estado === 'solicitud_soporte' || result.estado === 'finalizado') && (
                  <div className="relative">
                    <div className="absolute -left-[11px] top-1 h-3 w-3 rounded-full bg-[#093c2b] ring-4 ring-white" />
                    <div className="pl-6">
                      <h4 className="text-sm font-bold text-gray-800">Derivado a: Oficina de Trámites Administrativos</h4>
                      <p className="text-xs text-gray-500 mt-1">Estado: En evaluación por un administrador</p>
                    </div>
                  </div>
                )}

                {/* Paso 3: Finalizado */}
                {result.estado === 'finalizado' && (
                  <div className="relative">
                    <div className="absolute -left-[11px] top-1 h-3 w-3 rounded-full bg-[#093c2b] ring-4 ring-white" />
                    <div className="pl-6">
                      <h4 className="text-sm font-bold text-gray-800">Trámite Finalizado</h4>
                      <p className="text-xs text-gray-500 mt-1">Estado: Atención completada</p>
                      {result.finalizado_en && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <FiCheckCircle size={12} className="text-emerald-500" /> {new Date(result.finalizado_en).toLocaleString('es-PE')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
              </div>

              {result.estado !== 'finalizado' && (
                <div className="mt-8 bg-blue-50 text-blue-800 p-3 rounded-lg text-xs flex gap-2 border border-blue-100">
                  <FiInfo className="shrink-0 mt-0.5 text-blue-500" size={14} />
                  <p>Su solicitud está siguiendo el curso correspondiente. Manténgase al tanto revisando esta página con su código <strong>{result.codigo_ticket}</strong>.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
