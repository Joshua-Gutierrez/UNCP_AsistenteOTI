import { FiCheck } from 'react-icons/fi';
import { TbBrandWhatsapp } from 'react-icons/tb';

export default function MessageBubble({ msg, getTime, formatMessage }) {
  return (
    <div
      className={`flex w-full mb-6 ${
        msg.remitente === 'usuario' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${msg.remitente === 'usuario' ? 'items-end' : 'items-start'}`}>
        
        {/* Sender Info */}
        <div className="flex items-center gap-2 mb-1.5 px-1">
          {msg.remitente === 'usuario' ? (
            <>
              <span className="text-sm text-gray-500">{getTime(msg)}</span>
              <span className="font-semibold text-gray-700">Tú (Usuario)</span>
              <div className="w-6 h-6 rounded-full bg-[#b48e4b] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                TÚ
              </div>
            </>
          ) : (
            <>
              <span className="font-semibold text-gray-700">Asistente Virtual UNCP</span>
              <span className="text-sm text-gray-500">{getTime(msg)}</span>
            </>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={`px-4 py-3 text-sm leading-relaxed shadow-sm ${
            msg.remitente === 'usuario'
              ? 'bg-[#093c2b] text-white rounded-2xl rounded-tr-sm'
              : 'bg-[#f1f5f9] text-gray-800 rounded-2xl rounded-tl-sm'
          } ${msg.isImage ? 'bg-[#062c1f] border border-[#0b543b]' : ''}`}
        >
          {msg.remitente !== 'usuario' && typeof msg.contenido === 'string' && msg.contenido.startsWith('https://wa.me/') ? (
            <a
              href={msg.contenido}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold py-2 px-4 rounded-xl shadow-sm transition-colors text-sm"
            >
              <TbBrandWhatsapp size={18} /> Continuar por WhatsApp
            </a>
          ) : (
            <div className="whitespace-pre-wrap">{formatMessage(msg.contenido, msg.remitente)}</div>
          )}
        </div>

        {/* Read receipt / extra info */}
        {msg.remitente === 'usuario' && (
          <span className="text-sm text-gray-400 mt-1 flex items-center gap-1">
            <FiCheck className="w-4 h-4 text-emerald-500" />
            Entregado
          </span>
        )}
      </div>
    </div>
  );
}
