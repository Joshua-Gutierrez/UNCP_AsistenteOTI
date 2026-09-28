import { FiPaperclip, FiSend, FiLoader } from 'react-icons/fi';

export default function ChatInput({ input, setInput, onSubmit, onFileSelect, isCargando }) {
  return (
    <div className="p-4 bg-white border-t border-gray-100 rounded-b-xl sm:rounded-b-none mt-auto">
      <form onSubmit={onSubmit} className="flex gap-2 items-center max-w-3xl mx-auto">
        <label className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition cursor-pointer">
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
          placeholder="Escribe tu consulta o una opción... (Ej: 1, 2, menú o DNI)"
          className="flex-1 bg-gray-50 text-gray-800 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-[#093c2b]/20 border border-transparent focus:border-[#093c2b]/30 transition placeholder:text-gray-400 text-[14px]"
          disabled={isCargando}
        />
        
        <button
          type="submit"
          disabled={!input.trim() || isCargando}
          className="flex-shrink-0 bg-[#093c2b] text-white px-5 h-11 rounded-full font-medium hover:bg-[#062c1f] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-[14px]"
        >
          {isCargando ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Enviar
              <FiSend className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
