import { FiPaperclip, FiSend, FiLoader } from 'react-icons/fi';

export default function ChatInput({ input, setInput, onSubmit, onFileSelect, isCargando }) {
  return (
    <div className="p-4 bg-white border-t border-gray-100 rounded-b-xl sm:rounded-b-none mt-auto">
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] text-gray-400 text-center mb-2 flex items-center justify-center gap-1.5 font-medium">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[10px] text-gray-500">0</span> 
          <span>Envía un cero en cualquier momento para volver al menú principal</span>
        </p>
        <form onSubmit={onSubmit} className="flex gap-2 items-center">
          <label className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelect}
              disabled={isCargando}
            />
            <FiPaperclip className="w-5 h-5" />
          </label>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta..."
            className="flex-1 bg-gray-50 text-gray-800 rounded-full px-4 py-2.5 sm:px-5 sm:py-3 outline-none focus:ring-2 focus:ring-[#093c2b]/20 border border-transparent focus:border-[#093c2b]/30 transition placeholder:text-gray-400 text-sm min-w-0"
            disabled={isCargando}
          />
        
        <button
          type="submit"
          disabled={!input.trim() || isCargando}
          className="flex-shrink-0 bg-[#093c2b] text-white w-11 h-11 sm:w-auto sm:px-5 sm:h-11 rounded-full font-medium hover:bg-[#062c1f] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {isCargando ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">Enviar</span>
              <FiSend className="w-4 h-4" />
            </>
          )}
        </button>
        </form>
      </div>
    </div>
  );
}
