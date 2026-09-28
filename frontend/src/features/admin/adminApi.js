const API_URL = 'http://localhost:8000/api/v1/admin';

export const fetchNodosAdmin = async () => {
    try {
        const response = await fetch(`${API_URL}/nodos`);
        if (!response.ok) throw new Error('Error al obtener nodos');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const actualizarNodoAdmin = async (nodoId, mensajeSalida) => {
    try {
        const response = await fetch(`${API_URL}/nodos/${nodoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensaje_salida: mensajeSalida })
        });
        if (!response.ok) throw new Error('Error al actualizar');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const crearNodoAdmin = async (nuevoNodo) => {
    try {
        const response = await fetch(`${API_URL}/nodos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoNodo)
        });
        if (!response.ok) throw new Error('Error al crear nodo');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};