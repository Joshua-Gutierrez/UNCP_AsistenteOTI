import { FiCheck } from 'react-icons/fi';

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
              <span className="text-xs text-gray-500">{getTime(msg)}</span>
              <span className="font-semibold text-gray-700">Tú (Usuario)</span>
              <div className="w-6 h-6 rounded-full bg-[#b48e4b] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                TÚ
              </div>
            </>
          ) : (
            <>
              <span className="font-semibold text-gray-700">Asistente Virtual UNCP</span>
              <span className="text-xs text-gray-500">{getTime(msg)}</span>
            </>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={`px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
            msg.remitente === 'usuario'
              ? 'bg-[#093c2b] text-white rounded-2xl rounded-tr-sm'
              : 'bg-[#f1f5f9] text-gray-800 rounded-2xl rounded-tl-sm'
          } ${msg.isImage ? 'bg-[#062c1f] border border-[#0b543b]' : ''}`}
        >
          <div className="whitespace-pre-wrap">{formatMessage(msg.contenido, msg.remitente)}</div>
        </div>

        {/* Read receipt / extra info */}
        {msg.remitente === 'usuario' && (
          <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
            <FiCheck className="w-3 h-3 text-emerald-500" />
            Entregado
          </span>
        )}
      </div>
    </div>
  );
}
