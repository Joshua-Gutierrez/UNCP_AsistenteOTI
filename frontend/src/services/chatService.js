const API_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = `http://${API_HOST}:8000/api/v1`;
const API_URL = `${API_BASE_URL}/mensajes`;
let sessionRequest = null;

/**
 * Obtiene una sesión válida del backend y guarda su ID para conservar el historial.
 */
export const getSessionId = async () => {
    const storedSessionId = localStorage.getItem('uncp_chat_session');
    if (storedSessionId) {
        const sessionResponse = await fetch(`${API_URL}/${storedSessionId}`);
        if (sessionResponse.ok) return storedSessionId;
        localStorage.removeItem('uncp_chat_session');
    }

    if (!sessionRequest) {
        sessionRequest = fetch(`${API_BASE_URL}/sesiones/anonima`, {
            method: 'POST',
        })
            .then((response) => {
                if (!response.ok) throw new Error('No se pudo crear la sesión de chat');
                return response.json();
            })
            .then((session) => {
                localStorage.setItem('uncp_chat_session', session.id);
                return session.id;
            })
            .finally(() => {
                sessionRequest = null;
            });
    }

    return sessionRequest;
};

/**
 * Pide al backend todo el historial de una sesión.
 */
export const fetchHistorial = async (sessionId) => {
    try {
        const response = await fetch(`${API_URL}/${sessionId}`);
        // Si es una sesión nueva, el backend devuelve 404, lo cual es normal.
        if (response.status === 404) return [];
        if (!response.ok) throw new Error('Error al cargar historial');

        return await response.json();
    } catch (error) {
        console.error("Error en fetchHistorial:", error);
        return [];
    }
};

/**
 * Envía un nuevo mensaje al backend.
 */
export const sendMessage = async (sessionId, contenido) => {
    try {
        const response = await fetch(`${API_URL}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sesion_id: sessionId,
                remitente: 'usuario',
                contenido: contenido
            })
        });

        if (!response.ok) throw new Error('Error al enviar el mensaje');
        return await response.json();
    } catch (error) {
        console.error("Error en sendMessage:", error);
        throw error;
    }
};

export const sendDniImage = async (sessionId, imageFile) => {
    const formData = new FormData();
    formData.append('imagen', imageFile);

    const response = await fetch(`${API_URL}/imagen?sesion_id=${encodeURIComponent(sessionId)}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail || 'No se pudo validar la imagen del DNI');
    }
    return await response.json();
};