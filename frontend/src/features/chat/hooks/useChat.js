import { useState, useEffect, useRef } from 'react';
import { getSessionId, fetchHistorial, sendDniImage, sendMessage } from '../chatApi';

const esSolicitudDni = (contenido = '') => {
  const texto = contenido.toLowerCase();
  return texto.includes('dni') && (texto.includes('foto') || texto.includes('imagen') || texto.includes('suba') || texto.includes('adjunte'));
};

const esErrorValidacionDni = (contenido = '') => {
  const texto = contenido.toLowerCase();
  return (
    (texto.includes('validaci') && texto.includes('incorrecta')) ||
    texto.includes('intente de nuevo') ||
    texto.includes('no se pudo validar')
  );
};

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

export function useChat() {
  const [sesionId, setSesionId] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [textoInput, setTextoInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [error, setError] = useState(null);
  const [esperandoDni, setEsperandoDni] = useState(false);
  
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (smooth) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [mensajes]);

  useEffect(() => {
    if (!cargando) {
      inputRef.current?.focus();
    }
  }, [cargando]);

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
          setTimeout(() => scrollToBottom(false), 50);
        }
      } catch (error) {
        console.error('Error al iniciar el chat:', error);
        if (activo) setError('No se pudo conectar al servidor. Intenta recargar la página.');
      }
    };
    initChat();
    return () => { activo = false; };
  }, []);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!textoInput.trim() || !sesionId || cargando) return;

    const nuevoMensajeUsuario = { remitente: 'usuario', contenido: textoInput, timestamp: new Date() };
    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setTextoInput('');
    setCargando(true);
    setError(null);

    try {
      const respuestasBot = await sendMessage(sesionId, nuevoMensajeUsuario.contenido);
      const respuestas = Array.isArray(respuestasBot) ? respuestasBot : [respuestasBot];
      setMensajes((prev) => [...prev, ...respuestas.map(r => ({ ...r, timestamp: new Date() }))]);
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

    if (!archivo.type.startsWith('image/')) {
      setError(ERRORES_AMIGABLES.formato);
      e.target.value = '';
      return;
    }

    setCargando(true);
    setSubiendoImagen(true);
    setError(null);

    setMensajes((prev) => [...prev, { remitente: 'usuario', contenido: '📷 Enviando foto del DNI...', timestamp: new Date() }]);

    try {
      const mensajesBot = await sendDniImage(sesionId, archivo);
      const respuestas = Array.isArray(mensajesBot) ? mensajesBot : [mensajesBot];
      setMensajes((prev) => [
        ...prev.slice(0, -1),
        { remitente: 'usuario', contenido: '📷 Foto del DNI enviada', isImage: true, timestamp: new Date() },
        ...respuestas.map(r => ({ ...r, timestamp: new Date() })),
      ]);
      const ultimaRespuesta = respuestas[respuestas.length - 1];
      setEsperandoDni(esSolicitudDni(ultimaRespuesta?.contenido) || esErrorValidacionDni(ultimaRespuesta?.contenido));
    } catch (error) {
      setMensajes((prev) => prev.slice(0, -1));
      setError(mensajeAmigable(error?.message));
    } finally {
      e.target.value = '';
      setCargando(false);
      setSubiendoImagen(false);
    }
  };

  const handleRetry = () => {
    if (!sesionId || cargando) return;
    setError(null);
  };

  const resetChat = async () => {
    if (cargando) return;
    try {
      setCargando(true);
      await sendMessage(sesionId, '0');
      const historial = await fetchHistorial(sesionId);
      setMensajes(historial);
      scrollToBottom();
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  return {
    sesionId,
    mensajes,
    textoInput,
    setTextoInput,
    cargando,
    subiendoImagen,
    error,
    esperandoDni,
    messagesEndRef,
    scrollAreaRef,
    inputRef,
    manejarEnvio,
    manejarImagen,
    handleRetry,
    resetChat
  };
}
