import { useChat } from '../hooks/useChat';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { FiMessageCircle } from 'react-icons/fi';

export default function ChatContainer() {
  const {
    sesionId,
    mensajes,
    textoInput,
    setTextoInput,
    cargando,
    subiendoImagen,
    error,
    messagesEndRef,
    scrollAreaRef,
    inputRef,
    manejarEnvio,
    manejarImagen,
    handleRetry,
    resetChat
  } = useChat();

  const getTime = (msg) => {
    if (msg.timestamp) {
      return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(msg.timestamp);
    }
    return "Ahora";
  };

  const formatMessage = (text, remitente) => {
    return text.split('\n').map((line, i) => {
      const match = line.trim().match(/^([a-zA-Z0-9]\.)\s*(.+)$/);
      if (remitente !== 'usuario' && match) {
        return (
          <button
            key={i}
            onClick={() => { 
              const opcionTexto = match[1].replace('.', '').trim();
              manejarEnvio(null, opcionTexto);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 mr-2 bg-white border border-gray-200 text-[#093c2b] font-semibold rounded-full shadow-sm text-sm hover:bg-[#093c2b] hover:text-white transition-colors"
          >
            <span className="opacity-60">{match[1]}</span> {match[2]}
          </button>
        );
      }

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      if (urlRegex.test(line)) {
        const parts = line.split(urlRegex);
        return (
          <span key={i} className="block mb-1 last:mb-0 break-words">
            {parts.map((part, j) => {
              if (part.match(urlRegex)) {
                if (part.includes('wa.me')) {
                  return (
                    <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-[#25D366] text-white font-medium rounded-lg hover:bg-[#1DA851] transition shadow-sm decoration-transparent">
                      <FiMessageCircle size={18} />
                      Abrir en WhatsApp
                    </a>
                  );
                }
                return <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{part}</a>;
              }
              return part;
            })}
          </span>
        );
      }

      return <span key={i} className="block mb-1 last:mb-0">{line}</span>;
    });
  };

  return (
    <div className="flex-1 w-full bg-[#f4f7f9] flex flex-col font-sans text-gray-800">
      
      <ChatHeader onReset={resetChat} isCargando={cargando} />

      {/* Main Chat Area Centered */}
      <div className="flex-1 w-full flex justify-center p-2 sm:p-4 mt-2 sm:mt-4">
        <div className="w-full h-full flex-1 sm:h-[80vh] sm:max-h-[800px] sm:max-w-4xl flex flex-col overflow-hidden bg-white sm:border sm:border-gray-200 sm:rounded-xl shadow-sm">
          
          {/* Scrollable Messages Area */}
          <div 
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col bg-white"
            style={{ backgroundImage: 'radial-gradient(circle at center, #f8fafc 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          >
            
            {/* Aviso de privacidad */}
            <div className="flex justify-center mb-8">
              <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 max-w-sm w-full shadow-sm flex items-start gap-3">
                <span className="text-gray-400 mt-0.5">🔒</span>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-0.5">Sesión Segura</p>
                  <p className="text-xs text-gray-600 leading-snug">
                    Sesión autenticada bajo protocolo de protección de datos personales UNCP (Ley N° 29733)
                  </p>
                </div>
                <div className="ml-auto flex items-center justify-center">
                  <div className="text-[9px] text-gray-400 text-right">
                    <p>ID: {sesionId.split('-')[0]}-...-{sesionId.split('-').pop().slice(-4)}</p>
                    <p>{new Date().toLocaleDateString('es-PE')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="flex justify-center mb-6 animate-fade-in z-10 sticky top-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm text-sm max-w-sm flex items-start gap-3">
                  <span className="text-red-500 mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Ocurrió un problema</p>
                    <p>{error}</p>
                  </div>
                  <button onClick={handleRetry} className="text-gray-400 hover:text-red-700 p-1 rounded-md transition">✖</button>
                </div>
              </div>
            )}

            {/* Render Messages using MessageBubble component */}
            {mensajes.map((msg, index) => (
              <MessageBubble key={index} msg={msg} getTime={getTime} formatMessage={formatMessage} />
            ))}

            {/* Loading Indicator */}
            {cargando && !subiendoImagen && (
              <div className="flex items-center gap-2 text-gray-500 text-sm ml-4 mb-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="font-medium">Asistente está escribiendo...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <ChatInput 
            input={textoInput} 
            setInput={setTextoInput} 
            onSubmit={manejarEnvio} 
            onFileSelect={manejarImagen} 
            isCargando={cargando} 
          />
        </div>
      </div>
    </div>
  );
}
