import { useState, useEffect, useRef } from 'react';
import { getSessionId, fetchHistorial, sendDniImage, sendMessage } from '../../services/chatService';

const esSolicitudDni = (contenido = '') => {
  const texto = contenido.toLowerCase();
  return texto.includes('dni') && (texto.includes('foto') || texto.includes('imagen') || texto.includes('suba') || texto.includes('adjunte'));
};

// Si el OCR falla, el bot pide reintentar aunque no use las palabras clave exactas
const esErrorValidacionDni = (contenido = '') => {
  const texto = contenido.toLowerCase();
  return (
    (texto.includes('validaci') && texto.includes('incorrecta')) ||
    texto.includes('intente de nuevo') ||
    texto.includes('no se pudo validar')
  );
};

// Mapa de errores técnicos → mensajes amigables para el usuario final
const ERRORES_AMIGABLES = {
  smtp: 'No pudimos enviar el código de verificación. Intenta de nuevo en unos minutos.',
  ocr: 'No pudimos leer la imagen del DNI. Asegúrate de que la foto sea clara y esté bien iluminada.',
  pdf: 'Por favor envía una foto de tu DNI, no un PDF ni un documento.',
  formato: 'El archivo no es una imagen válida. Envía una foto en formato JPG, PNG o similar.',
  default: 'Ocurrió un problema. Intenta de nuevo en unos momentos.',
};

function mensajeAmigable(errorMsg = '') {
  const msg = errorMsg.toLowerCase();
  if (msg.includes('smtp') || msg.includes('correo') || msg.includes('email')) return ERRORES_AMIGABLES.smtp;
  if (msg.includes('ocr') || msg.includes('reconoc') || msg.includes('leer') || msg.includes('validar')) return ERRORES_AMIGABLES.ocr;
  if (msg.includes('pdf')) return ERRORES_AMIGABLES.pdf;
  if (msg.includes('formato') || msg.includes('tipo') || msg.includes('mime')) return ERRORES_AMIGABLES.formato;
  return ERRORES_AMIGABLES.default;
}

export default function ChatContainer() {
  const [sesionId, setSesionId] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [textoInput, setTextoInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [error, setError] = useState(null);
  const [esperandoDni, setEsperandoDni] = useState(false);
  const messagesEndRef = useRef(null);  // marcador al final de la lista
  const scrollAreaRef = useRef(null);   // contenedor con overflow-y-auto
  const inputRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (smooth) {
      // Scroll suave para mensajes nuevos
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
      // Scroll inmediato al cargar el historial
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [mensajes]);

  // Devolver el foco al input cuando termina de cargar (el input estaba disabled)
  useEffect(() => {
    if (!cargando) {
      inputRef.current?.focus();
    }
  }, [cargando]);

  // 1. Al cargar la página: Obtener la sesión y el historial
  useEffect(() => {
    let activo = true;

    const initChat = async () => {
      try {
        const id = await getSessionId();
        if (!activo) return;
        setSesionId(id);

        const historial = await fetchHistorial(id);
        if (activo) {
          setMensajes(historial);
          const ultimoMensaje = historial[historial.length - 1];
          setEsperandoDni(ultimoMensaje?.remitente === 'asistente' && esSolicitudDni(ultimoMensaje.contenido));
          // Scroll inmediato (sin animación) al restaurar el historial
          setTimeout(() => scrollToBottom(false), 50);
        }
      } catch (error) {
        console.error('Error al iniciar el chat:', error);
        if (activo) setError('No se pudo conectar al servidor. Intenta recargar la página.');
      }
    };
    initChat();

    return () => {
      activo = false;
    };
  }, []);

  // 2. Función para enviar un mensaje
  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!textoInput.trim() || !sesionId || cargando) return;

    const nuevoMensajeUsuario = { remitente: 'usuario', contenido: textoInput };
    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setTextoInput('');
    setCargando(true);
    setError(null);

    try {
      const respuestasBot = await sendMessage(sesionId, nuevoMensajeUsuario.contenido);
      // El endpoint ahora devuelve siempre un array de mensajes
      const respuestas = Array.isArray(respuestasBot) ? respuestasBot : [respuestasBot];
      setMensajes((prev) => [...prev, ...respuestas]);
      const ultimaRespuesta = respuestas[respuestas.length - 1];
      setEsperandoDni(esSolicitudDni(ultimaRespuesta?.contenido));
    } catch (error) {
      console.error("Error de comunicación:", error);
      setError(mensajeAmigable(error?.message));
    } finally {
      setCargando(false);
    }
  };

  const manejarImagen = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo || !sesionId || cargando) return;

    // Validación MIME type en el cliente — antes de llamar al API
    if (!archivo.type.startsWith('image/')) {
      setError(ERRORES_AMIGABLES.formato);
      e.target.value = '';
      return;
    }

    setCargando(true);
    setSubiendoImagen(true);
    setError(null);

    // Burbuja optimista: el usuario ve feedback inmediato mientras procesa el OCR
    setMensajes((prev) => [...prev, { remitente: 'usuario', contenido: '📷 Enviando foto del DNI...' }]);

    try {
      // El endpoint devuelve un array de mensajes (puede incluir auto-avances)
      const mensajesBot = await sendDniImage(sesionId, archivo);
      const respuestas = Array.isArray(mensajesBot) ? mensajesBot : [mensajesBot];
      setMensajes((prev) => [
        // Reemplaza la burbuja optimista por el resultado real
        ...prev.slice(0, -1),
        { remitente: 'usuario', contenido: '📷 Foto del DNI enviada' },
        ...respuestas,
      ]);
      // Evaluar el último mensaje para decidir si seguir mostrando el botón DNI
      const ultimaRespuesta = respuestas[respuestas.length - 1];
      setEsperandoDni(
        esSolicitudDni(ultimaRespuesta?.contenido) ||
        esErrorValidacionDni(ultimaRespuesta?.contenido)
      );
    } catch (error) {
      // Quitar la burbuja optimista si falló
      setMensajes((prev) => prev.slice(0, -1));
      setError(mensajeAmigable(error?.message));
    } finally {
      e.target.value = '';
      setCargando(false);
      setSubiendoImagen(false);
    }
  };

  const handleRetry = () => {
    if (!textoInput.trim() || !sesionId || cargando) return;
    manejarEnvio({ preventDefault: () => { } });
  };

  const formatMessage = (text) => {
    return text
      .split('\n')
      .map((line, i) => <span key={i}>{line}</span>)
      .reduce((acc, curr, i) => [...acc, i > 0 && <br key={`br-${i}`} />, curr], []);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl h-[90vh] max-h-[800px] card flex flex-col overflow-hidden animate-fade-in">

        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-brand-primary)]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg text-[var(--color-text-primary)]">UNCP Asistente Virtual</h1>
              <span className="badge badge-primary text-xs">Julie v1.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success-base)] animate-pulse-ring"></span>
              En línea
            </span>
          </div>
        </header>

        {/* Messages Area — scrollAreaRef controla el scroll del contenedor */}
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[var(--color-bg-base)]"
        >
          {error && (
            <div className="alert alert-error max-w-md mx-auto animate-fade-in" role="alert">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div className="flex-1">{error}</div>
              <button onClick={handleRetry} className="btn btn-danger btn-sm flex-shrink-0">Reintentar</button>
            </div>
          )}

          {mensajes.length === 0 && !cargando && !error && (
            <div className="empty-state flex-1">
              <div className="empty-state-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="empty-state-title">Bienvenido a Julie</h3>
              <p className="empty-state-text">
                Soy tu asistente virtual de la UNCP. Escribe <strong>1</strong> para pagos, <strong>2</strong> para claves,
                o tu consulta y te ayudaré.
              </p>
            </div>
          )}

          {mensajes.map((msg, index) => (
            <div key={`${msg.id || index}-${msg.remitente}`} className={`flex animate-fade-in ${msg.remitente === 'usuario' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.remitente === 'usuario' ? '' : 'text-[var(--color-text-primary)]'}`}>
                {msg.remitente !== 'usuario' && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-brand-primary)]">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">Julie</span>
                  </div>
                )}
                <div
                  className={`p-3.5 shadow-sm text-[15px] ${
                    msg.remitente === 'usuario'
                      ? 'bg-[var(--color-brand-primary)] text-white rounded-2xl rounded-tr-sm'
                      : 'bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-2xl rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{formatMessage(msg.contenido)}</p>
                </div>
              </div>
            </div>
          ))}

          {cargando && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] p-3 rounded-2xl rounded-tl-none shadow-md text-sm flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-[var(--color-secondary)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {subiendoImagen ? 'Procesando foto del DNI...' : 'Julie está escribiendo...'}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <footer className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
          {error && (
            <div className="mb-3 flex items-center gap-2 text-sm text-[var(--color-error)]">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="flex gap-2">
            <label className={`btn btn-secondary px-3 py-2.5 cursor-pointer ${!esperandoDni || cargando ? 'opacity-50 pointer-events-none' : ''}`} aria-label="Enviar foto del DNI">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={manejarImagen} disabled={!esperandoDni || cargando} />
              <span aria-hidden="true">📷</span>
              <span className="hidden sm:inline">DNI</span>
            </label>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={textoInput}
                onChange={(e) => setTextoInput(e.target.value)}
                placeholder="Escribe tu consulta o una opción (1, 2, menú)..."
                className="input pr-12 bg-[var(--color-bg-base)] border-[var(--color-border-subtle)] focus:border-[var(--color-brand-primary)] transition-colors"
                disabled={cargando}
                maxLength={500}
              />
              {textoInput && (
                <button
                  type="button"
                  onClick={() => setTextoInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] transition-colors"
                  aria-label="Limpiar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={cargando || !textoInput.trim()}
              className="btn btn-primary px-6 py-2.5 flex items-center gap-2"
              aria-label={cargando ? 'Enviando...' : 'Enviar mensaje'}
            >
              {cargando ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>

          <p className="mt-3 text-center text-xs text-[var(--color-text-tertiary)]">
            Opciones rápidas: <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] font-mono text-[var(--color-brand-primary)]">1</kbd> Pagos · <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] font-mono text-[var(--color-brand-primary)]">2</kbd> Claves · <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-strong)] font-mono text-[var(--color-brand-primary)]">0</kbd> Volver al inicio
          </p>
        </footer>
      </div>
    </div>
  );
}