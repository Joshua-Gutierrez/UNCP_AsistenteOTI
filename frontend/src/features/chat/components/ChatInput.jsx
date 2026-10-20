import { FiPaperclip, FiCamera, FiSend, FiLoader } from 'react-icons/fi';

export default function ChatInput({
  input,
  setInput,
  onSubmit,
  onFileSelect,
  isCargando,
  esperandoDni = false,
  onReset,
  inputRef,
}) {
  return (
    <div className="p-4 bg-white border-t border-gray-100 rounded-b-xl sm:rounded-b-none mt-auto">
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] text-gray-400 text-center mb-2 flex items-center justify-center gap-1.5 font-medium">
          {esperandoDni ? (
            <span className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Esperando que subas la foto del DNI</span>
              {onReset && (
                <>
                  <span className="text-emerald-300">•</span>
                  <button
                    type="button"
                    onClick={onReset}
                    className="text-emerald-700 hover:text-emerald-900 underline font-semibold cursor-pointer"
                  >
                    Volver al menú
                  </button>
                </>
              )}
            </span>
          ) : (
            <>
              <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono text-[10px] text-gray-500">0</span> 
              <span>Envía un cero en cualquier momento para volver al menú principal</span>
            </>
          )}
        </p>

        <form onSubmit={onSubmit} className="flex gap-2 items-center">
          {/* Input de DNI (Foto / Archivo) */}
          {esperandoDni ? (
            <label
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 sm:px-4 h-11 rounded-full font-medium transition shadow-md cursor-pointer ${
                isCargando
                  ? 'opacity-60 cursor-wait bg-emerald-700 text-white'
                  : 'bg-[#093c2b] text-white hover:bg-[#062c1f] ring-2 ring-emerald-400 ring-offset-2 animate-pulse'
              }`}
              title="Haz clic aquí para seleccionar o tomar la foto de tu DNI"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileSelect}
                disabled={isCargando}
              />
              <FiCamera className="w-5 h-5 shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap">Subir foto DNI</span>
            </label>
          ) : (
            <label
              className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed opacity-40 select-none pointer-events-none"
              title="El envío de foto solo está activo cuando el sistema solicita la foto del DNI"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={true}
              />
              <FiPaperclip className="w-5 h-5 text-gray-400" />
            </label>
          )}

          {/* Input de Texto */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              esperandoDni
                ? "Adjunta la foto de tu DNI con el botón para continuar..."
                : "Escribe tu consulta..."
            }
            className={`flex-1 rounded-full px-4 py-2.5 sm:px-5 sm:py-3 outline-none transition text-sm min-w-0 ${
              esperandoDni
                ? 'bg-gray-100 text-gray-400 border border-dashed border-gray-300 cursor-not-allowed select-none placeholder:text-gray-400'
                : 'bg-gray-50 text-gray-800 focus:ring-2 focus:ring-[#093c2b]/20 border border-transparent focus:border-[#093c2b]/30 placeholder:text-gray-400'
            }`}
            disabled={isCargando || esperandoDni}
          />

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={!input.trim() || isCargando || esperandoDni}
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
