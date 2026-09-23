import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiGitBranch, FiLogOut, FiMessageSquare, FiUsers } from 'react-icons/fi';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const API_BASE = 'http://localhost:8000/api/v1/admin';

const NODOS_TIPOS = [
  { value: 'OPCION', label: 'Opción', description: 'Responde con su contenido y puede continuar hacia otro nodo conectado.', color: 'var(--color-node-opcion)', bg: 'var(--color-bg-elevated)' },
  { value: 'ENVIAR_TEXTO', label: 'Texto', description: 'Entrega su contenido como respuesta.', color: 'var(--color-node-accion)', bg: 'var(--color-bg-card)' },
  { value: 'FINAL', label: 'Final', description: 'Entrega su contenido y cierra el recorrido de esta conversación.', color: 'var(--color-node-final)', bg: 'var(--color-danger-bg)' },
  { value: 'FINAL_ATENDIDO', label: 'Final atendido', description: 'Crea un caso en la bandeja de atendidos.', color: 'var(--color-node-final)', bg: 'var(--color-success-bg)' },
  { value: 'FINAL_MANUAL', label: 'Final necesita atención manual', description: 'Crea un caso en la bandeja de atención manual.', color: 'var(--color-node-final)', bg: 'var(--color-warning-bg)' },
  { value: 'FINAL_SOPORTE', label: 'Final necesita soporte', description: 'Crea un caso en la bandeja de soporte.', color: 'var(--color-node-final)', bg: 'var(--color-danger-bg)' },
];

const BANDEJAS_FINALES = [
  { value: 'atendido', label: 'Final atendido' },
  { value: 'manual', label: 'Final necesita atención manual' },
  { value: 'solicitud_soporte', label: 'Final necesita soporte' },
];

const TIPO_COLORES = {
  menu: { border: 'var(--color-node-menu)', bg: 'var(--color-bg-elevated)', text: 'var(--color-node-menu)' },
  opcion: { border: 'var(--color-node-opcion)', bg: 'var(--color-bg-elevated)', text: 'var(--color-node-opcion)' },
  condicion: { border: 'var(--color-node-condicion)', bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)' },
  accion: { border: 'var(--color-node-accion)', bg: 'var(--color-bg-card)', text: 'var(--color-text-primary)' },
  final: { border: 'var(--color-node-final)', bg: 'var(--color-danger-bg)', text: 'var(--color-danger-text)' },
};

function NodoPersonalizado({ data, selected }) {
  const tipoNormalizado = String(data.tipo || '').toLowerCase();
  const colores = tipoNormalizado.startsWith('final') ? TIPO_COLORES.final : TIPO_COLORES[tipoNormalizado] || TIPO_COLORES.opcion;
  const isMenu = data.codigo === 'menu_principal' || tipoNormalizado === 'menu';
     const isCondicion = tipoNormalizado === 'condicion';
     const isInactivo = data.activo === false;

  return (
    <div
      className={`cursor-pointer transition-all duration-200 ${isInactivo ? 'opacity-60' : ''}`}
      style={{
        background: selected ? colores.bg : 'var(--color-bg-card)',
        border: `2px solid ${selected ? colores.border : colores.border + '80'}`,
        borderLeft: `4px solid ${colores.border}`,
        borderRadius: '10px',
        padding: '14px',
        width: 280,
        minHeight: 90,
        boxShadow: selected
          ? `0 0 0 2px ${colores.border}, 0 8px 24px rgba(0,0,0,0.4)`
          : '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: colores.border, width: 14, height: 14, border: '2px solid var(--color-bg-base)', borderRadius: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: colores.border, width: 14, height: 14, border: '2px solid var(--color-bg-base)', borderRadius: '50%' }}
      />

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[var(--color-text-primary)] truncate max-w-[200px]" title={data.codigo}>
          {data.codigo}
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium uppercase tracking-wider"
          style={{ background: colores.border }}
        >
          {data.tipo.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{data.contenido || '(sin contenido)'}</p>
      {data.valor_entrada && (
        <p className="text-[10px] mt-2 italic truncate" style={{ color: colores.text }}>
          Si: {data.valor_entrada}
        </p>
      )}
      {isMenu && <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Nodo inicial</div>}
      {isCondicion && <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> Condición</div>}
      {isInactivo && <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-danger-text)]">Inactivo, puede reactivarse</div>}
    </div>
  );
}

function EdgeConEtiqueta({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, style }) {
  const legacyNumber = Number(data?.valor_entrada);
  const numero = Number(data?.orden) > 0 ? Number(data.orden) : (Number.isInteger(legacyNumber) && legacyNumber > 0 ? legacyNumber : null);
  const etiqueta = data?.etiqueta || '';
  const textoEtiqueta = etiqueta ? `${numero ? `${numero}. ` : ''}${etiqueta}` : (numero ? String(numero) : '');
  const edgeColor = 'var(--color-brand-primary)';
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ ...style, stroke: edgeColor, strokeWidth: 2 }} markerEnd={MarkerType.ArrowClosed} />
      {textoEtiqueta && (
        <EdgeLabelRenderer>
          <div
            className="flow-edge-label"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {textoEtiqueta}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(location.state?.sidebarCollapsed === true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [formCodigo, setFormCodigo] = useState('');
  const [formTipo, setFormTipo] = useState('OPCION');
  const [formBandejaDestino, setFormBandejaDestino] = useState('atendido');
  const [formContenido, setFormContenido] = useState('');
  const [formActivo, setFormActivo] = useState(true);
  const [formEtiqueta, setFormEtiqueta] = useState('');
  const [formOrden, setFormOrden] = useState(1);
  const [nodoEditandoId, setNodoEditandoId] = useState(null);
  const [edgeEditandoId, setEdgeEditandoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validacion, setValidacion] = useState(null);

  const cargarGrafo = useCallback(async () => {
    try {
      setError(null);
      const [nodosRes, edgesRes] = await Promise.all([
        fetch(`${API_BASE}/nodos`, { credentials: 'include' }),
        fetch(`${API_BASE}/opciones`, { credentials: 'include' }),
      ]);

      if (!nodosRes.ok || !edgesRes.ok) throw new Error('Error al cargar grafo');

      const nodosData = await nodosRes.json();
      const edgesData = await edgesRes.json();

      const nodosActivos = (nodosData || []).filter((nodo) => nodo.activo);
      const idsNodosActivos = new Set(nodosActivos.map((nodo) => nodo.id));

      const formattedNodes = nodosActivos.map((nodo) => ({
        id: nodo.id,
        type: 'custom',
        position: { x: nodo.posicion_x || 0, y: nodo.posicion_y || 0 },
        data: {
          id: nodo.id,
          codigo: nodo.codigo,
          tipo: nodo.tipo,
          contenido: nodo.contenido,
          bandeja_destino: nodo.bandeja_destino,
          activo: nodo.activo,
          valor_entrada: null,
        },
      }));

      const formattedEdges = (edgesData || [])
        .filter((edge) => idsNodosActivos.has(edge.nodo_origen_id) && idsNodosActivos.has(edge.nodo_destino_id))
        .map((edge) => ({
        id: edge.id,
        source: edge.nodo_origen_id,
        target: edge.nodo_destino_id,
        type: 'custom-edge',
        animated: true,
        label: edge.etiqueta || '',
        data: {
          etiqueta: edge.etiqueta || '',
          valor_entrada: edge.valor_entrada || '',
          orden: edge.orden > 0 ? edge.orden : (Number(edge.valor_entrada) > 0 ? Number(edge.valor_entrada) : null),
        },
        style: { stroke: 'var(--color-brand-primary)', strokeWidth: 2 },
        }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);

      if (reactFlowInstance) {
        setTimeout(() => reactFlowInstance.fitView({ padding: 0.15, duration: 400 }), 100);
      }
    } catch (err) {
      console.error('Error al conectar con la base de datos:', err);
      setError('No se pudo conectar al backend. Verifica que el servidor esté corriendo en puerto 8000 y que hayas iniciado sesión.');
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [reactFlowInstance]);

  const validarArbol = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/nodos/validar`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al validar');
      const data = await res.json();
      setValidacion(data);
    } catch (err) {
      console.error('Error validando:', err);
    }
  }, []);

  useEffect(() => {
    cargarGrafo();
    validarArbol();
  }, [cargarGrafo, validarArbol]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => {
    const nextNodes = applyNodeChanges(changes, nds);
    return nextNodes.map((node) => ({
      ...node,
      position: node.position || { x: 0, y: 0 },
    }));
  }), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onConnect = useCallback(async (params) => {
    const edgeId = `edge-${Date.now()}`;
    const newEdge = {
      ...params,
      id: edgeId,
      type: 'custom-edge',
      animated: true,
      data: { etiqueta: '', valor_entrada: '', orden: null },
      style: { stroke: 'var(--color-brand-primary)', strokeWidth: 2 },
    };

    setEdges((eds) => addEdge(newEdge, eds));

    try {
      const res = await fetch(`${API_BASE}/opciones`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodo_origen_id: params.source,
          nodo_destino_id: params.target,
          etiqueta: '',
          valor_entrada: '',
          orden: 0,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error guardando conexión');
      }

      const savedEdge = await res.json();
      setEdges((eds) => eds.map(e => e.id === edgeId
        ? {
            ...e,
            id: savedEdge.id,
            data: {
              etiqueta: savedEdge.etiqueta || '',
              valor_entrada: savedEdge.valor_entrada || '',
              orden: savedEdge.orden > 0 ? savedEdge.orden : null,
            },
          }
        : e));
      await validarArbol();
    } catch (err) {
      console.error('Error creando transición:', err);
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      alert(`Error al guardar la conexión: ${err.message}`);
    }
  }, [validarArbol]);

  const agregarClusterDNI = useCallback(async () => {
    const baseId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const solicitudId = `dni_solicitud_${baseId}`;
    const errorId = `dni_error_${baseId}`;
    const exitoId = `dni_exito_${baseId}`;
    const nodosDni = [
      {
        codigo: solicitudId,
        contenido: 'Suba una imagen de su DNI',
        tipo: 'ACCION',
        posicion_x: 920,
        posicion_y: 80,
      },
      {
        codigo: errorId,
        contenido: 'Validación incorrecta. Intente de nuevo.',
        tipo: 'MENSAJE',
        posicion_x: 1160,
        posicion_y: 80,
      },
      {
        codigo: exitoId,
        contenido: 'Validación exitosa. Nombre: {nombre_usuario}, Correo: {correo_usuario}',
        tipo: 'MENSAJE_DINAMICO',
        posicion_x: 1400,
        posicion_y: 80,
      },
    ];

    try {
      const respuestasNodos = await Promise.all(nodosDni.map((nodo) => fetch(`${API_BASE}/nodos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nodo, bandeja_destino: null, activo: true }),
      })));
      if (respuestasNodos.some((res) => !res.ok)) throw new Error('No se pudieron crear los nodos DNI');

      const nodosGuardados = await Promise.all(respuestasNodos.map((res) => res.json()));
      const [solicitud, error, exito] = nodosGuardados;
      const conexiones = [
        { nodo_origen_id: solicitud.id, nodo_destino_id: error.id, etiqueta: 'error', valor_entrada: 'error', orden: 0 },
        { nodo_origen_id: error.id, nodo_destino_id: solicitud.id, etiqueta: '', valor_entrada: '', orden: 0 },
        { nodo_origen_id: solicitud.id, nodo_destino_id: exito.id, etiqueta: 'exito', valor_entrada: 'exito', orden: 0 },
      ];
      const respuestasConexiones = await Promise.all(conexiones.map((conexion) => fetch(`${API_BASE}/opciones`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conexion),
      })));
      if (respuestasConexiones.some((res) => !res.ok)) throw new Error('No se pudieron crear las conexiones DNI');

      await cargarGrafo();
      await validarArbol();
      alert('Nodos y conexiones DNI creados correctamente.');
    } catch (err) {
      console.error('Error creando flujo DNI:', err);
      alert(`Error al crear el flujo DNI: ${err.message}`);
    }
  }, [cargarGrafo, validarArbol]);

  const agregarClusterGmail = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/nodos/plantilla/verificacion-correo`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'No se pudo crear el cluster Gmail');
      }

      const data = await res.json();
      await cargarGrafo();
      await validarArbol();
      alert(
        `✅ Cluster Gmail creado (sufijo: ${data.sufijo})\n\n` +
        `Nodos creados:\n` +
        `• ${data.nodos.solicitar.codigo}  ← entrada\n` +
        `• ${data.nodos.exito.codigo}  ← éxito\n` +
        `• ${data.nodos.baneado.codigo}  ← ban\n\n` +
        `Arrastra el nodo "solicitar" y conéctalo desde tu menú.`
      );
    } catch (err) {
      console.error('Error creando cluster Gmail:', err);
      alert(`Error al crear el cluster Gmail: ${err.message}`);
    }
  }, [cargarGrafo, validarArbol]);

  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
    instance.fitView({ padding: 0.15 });
  }, []);

  const onNodeClick = useCallback((_, node) => {
    setNodoEditandoId(node.id);
    setFormCodigo(node.data.codigo);
    setFormTipo(node.data.tipo);
    setFormBandejaDestino(node.data.bandeja_destino || 'atendido');
    setFormContenido(node.data.contenido);
    setFormActivo(node.data.activo);
    setFormEtiqueta('');
    setFormOrden(1);
    setEdgeEditandoId(null);
  }, []);

  const onEdgeClick = useCallback((_, edge) => {
    setEdgeEditandoId(edge.id);
    setFormEtiqueta(edge.data?.etiqueta || edge.label || '');
    setFormOrden(Number(edge.data?.orden || 1));
    setNodoEditandoId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setNodoEditandoId(null);
    setEdgeEditandoId(null);
  }, []);

  const limpiarSeleccion = useCallback(() => {
    setNodoEditandoId(null);
    setEdgeEditandoId(null);
    setFormCodigo('');
    setFormTipo('OPCION');
    setFormBandejaDestino('atendido');
    setFormContenido('');
    setFormActivo(true);
    setFormEtiqueta('');
    setFormOrden(1);
  }, []);

  const onEditorPointerDown = useCallback((event) => {
    const target = event.target;
    if (target.closest('.react-flow__node') || target.closest('.flow-editor-form')) return;
    limpiarSeleccion();
  }, [limpiarSeleccion]);

  const handleNodeDragStop = useCallback(async (_event, node) => {
    if (!node.id.startsWith('edge-')) {
      try {
        await fetch(`${API_BASE}/nodos/${node.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: node.data.codigo,
            tipo: node.data.tipo,
            contenido: node.data.contenido,
            bandeja_destino: node.data.bandeja_destino,
            activo: node.data.activo,
            posicion_x: Math.round(node.position.x),
            posicion_y: Math.round(node.position.y),
          }),
        });
      } catch (err) {
        console.error('Error guardando posición:', err);
        cargarGrafo();
      }
    }
  }, [cargarGrafo]);

  const handleSubmitNodo = async (e) => {
    e.preventDefault();
    if (!formCodigo.trim() || !formContenido.trim()) {
      alert('Código y contenido son obligatorios.');
      return;
    }

    const payload = {
      codigo: formCodigo.trim(),
      tipo: formTipo,
      contenido: formContenido.trim(),
      bandeja_destino: formTipo.startsWith('FINAL') ? (formTipo === 'FINAL' ? formBandejaDestino : formTipo === 'FINAL_SOPORTE' ? 'solicitud_soporte' : formTipo === 'FINAL_MANUAL' ? 'manual' : 'atendido') : null,
      activo: formActivo,
      posicion_x: 100,
      posicion_y: 100,
    };

    try {
      let res;
      if (nodoEditandoId) {
        res = await fetch(`${API_BASE}/nodos/${nodoEditandoId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/nodos`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(errData.detail || 'No se pudo guardar');
      }

      const savedNode = await res.json();

      if (nodoEditandoId) {
        setNodes((nds) => {
          const nextNodes = nds.map((n) =>
            n.id === nodoEditandoId ? { ...n, data: { ...n.data, ...savedNode } } : n
          );
          return nextNodes;
        });
        alert('¡Nodo actualizado!');
      } else {
        const newNode = {
          id: savedNode.id,
          type: 'custom',
          position: { x: 100, y: 100 },
          data: { ...savedNode, valor_entrada: null },
        };
        setNodes((nds) => [...nds, newNode]);
        alert('¡Nodo creado!');
      }

      resetFormularioNodo();
      await validarArbol();
      if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.15, duration: 300 });
    } catch (err) {
      console.error('Error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleSubmitEdge = async (e) => {
    e.preventDefault();
    if (!edgeEditandoId) return;

    const edge = edges.find((e) => e.id === edgeEditandoId);
    if (!edge) return;

    try {
      const res = await fetch(`${API_BASE}/opciones/${edgeEditandoId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodo_origen_id: edge.source,
          nodo_destino_id: edge.target,
          etiqueta: formEtiqueta.trim(),
          orden: Number(formOrden) || 1,
        }),
      });

      if (!res.ok) throw new Error('Error guardando opción');

      setEdges((eds) => {
        const nextEdges = eds.map((e) =>
          e.id === edgeEditandoId
            ? { ...e, label: `${formOrden}. ${formEtiqueta || 'Sin etiqueta'}`, data: { ...e.data, etiqueta: formEtiqueta.trim(), orden: Number(formOrden) || 1 } }
            : e
        );
        return nextEdges;
      });
      alert('¡Opción guardada!');
      await validarArbol();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
    setEdgeEditandoId(null);
    setFormEtiqueta('');
    setFormOrden(1);
  };

  const handleDeleteNodo = async () => {
    if (!nodoEditandoId) return;
    if (!confirm('¿Desactivar este nodo y eliminar sus conexiones? Podrás reactivarlo después desde el editor.')) return;

    try {
      const res = await fetch(`${API_BASE}/nodos/${nodoEditandoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'No se pudo eliminar');
      }

      setNodes((nds) => nds.map((n) => n.id === nodoEditandoId
        ? { ...n, data: { ...n.data, activo: false } }
        : n
      ));
      setEdges((eds) => eds.filter((e) => e.source !== nodoEditandoId && e.target !== nodoEditandoId));
      alert('Nodo desactivado y conexiones eliminadas. Puedes reactivarlo editando el nodo.');
      await validarArbol();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
    resetFormularioNodo();
  };

  const handleDeleteEdge = async () => {
    if (!edgeEditandoId) return;
    if (!confirm('¿Eliminar esta conexión?')) return;

    try {
      const res = await fetch(`${API_BASE}/opciones/${edgeEditandoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('No se pudo eliminar');

      setEdges((eds) => eds.filter((e) => e.id !== edgeEditandoId));
      alert('Conexión eliminada');
      await validarArbol();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
    setEdgeEditandoId(null);
  };

  const resetFormularioNodo = () => {
    setFormCodigo('');
    setFormTipo('OPCION');
    setFormBandejaDestino('atendido');
    setFormContenido('');
    setFormActivo(true);
    setNodoEditandoId(null);
  };

  async function logout() {
    await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
    navigate('/admin/login', { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="loading-spinner animate-fade-in">
          <svg fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Cargando editor de flujo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-dashboard admin-editor-shell ${sidebarCollapsed ? 'admin-dashboard--sidebar-collapsed' : ''}`} onPointerDown={onEditorPointerDown}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar__top">
          <Link to="/admin" className="admin-brand"><strong>UNCP</strong><span>Asistente</span></Link>
          <button type="button" className="admin-sidebar__toggle" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'} title={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}>
            {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>
        <nav className="admin-nav" aria-label="Navegación de administración">
          <Link to="/admin" className="admin-nav__item"><FiMessageSquare /><span>Mensajes</span></Link>
          <Link to="/admin" className="admin-nav__item"><FiUsers /><span>Perfiles</span></Link>
          <Link to="/admin/editor" className="admin-nav__item admin-nav__item--active"><FiGitBranch /><span>Flujo de respuesta</span></Link>
        </nav>
        <button type="button" className="admin-nav__item admin-nav__logout" onClick={logout}><FiLogOut /><span>Cerrar sesión</span></button>
      </aside>
      <main className="admin-editor-main">
      <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] p-4 md:p-6 font-sans">
        <div className="container h-[calc(100vh-2rem)] flex flex-col">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">Editor Visual de Flujo</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">
              Arrastra nodos, conéctalos, edita condiciones. Código único por nodo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={agregarClusterDNI}
              className="btn btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              CREAR NODO DNI
            </button>
            <button
              type="button"
              onClick={agregarClusterGmail}
              className="btn btn-tertiary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              CREAR NODO GMAIL
            </button>
            <button
              onClick={cargarGrafo}
              disabled={loading}
              className="btn btn-outline flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recargar
            </button>
            <button
              onClick={validarArbol}
              className="btn btn-tertiary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Validar
            </button>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error animate-fade-in mb-6" role="alert">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Validation Strip */}
        {validacion && !validacion.valido && (
          <div className="alert alert-warning animate-fade-in mb-6" role="alert">
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium mb-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                Problemas de validación del árbol
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validacion.problemas.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setValidacion({ valido: true, problemas: [] })}
              className="flex-shrink-0 text-[var(--color-brand-primary)] font-medium hover:underline"
            >
              Ocultar
            </button>
          </div>
        )}

        <div className="flow-editor-layout">
        {/* Form Panel */}
        <form onSubmit={handleSubmitNodo} className="card flow-editor-form p-4 md:p-5 animate-slide-in">
          {/* Editing Node */}
          {nodoEditandoId && (
            <div className="flex flex-col gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="label">Código único</label>
                <input
                  type="text"
                  value={formCodigo}
                  disabled
                  className="input bg-[var(--color-bg-base)] cursor-not-allowed"
                />
              </div>
              <div className="flex-1 min-w-[280px]">
                <label className="label">Contenido / Mensaje</label>
                <textarea
                  rows="7"
                  placeholder="Mensaje que enviará el bot..."
                  value={formContenido}
                  onChange={(e) => setFormContenido(e.target.value)}
                  className="input message-textarea"
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="label">Tipo</label>
                <select
                  value={formTipo}
                  onChange={(e) => setFormTipo(e.target.value)}
                  className="input"
                >
                  {NODOS_TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <p className="node-type-help">{NODOS_TIPOS.find((tipo) => tipo.value === formTipo)?.description}</p>
              </div>
              {formTipo === 'FINAL' && (
                <div className="w-full">
                  <label className="label">Bandeja del caso final</label>
                  <select value={formBandejaDestino} onChange={(e) => setFormBandejaDestino(e.target.value)} className="input">
                    {BANDEJAS_FINALES.map((bandeja) => <option key={bandeja.value} value={bandeja.value}>{bandeja.label}</option>)}
                  </select>
                </div>
              )}
              <div className="w-full sm:w-28 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={formActivo}
                    onChange={(e) => setFormActivo(e.target.checked)}
                    className="w-4 h-4 accent-[var(--color-brand-primary)] border-[var(--color-border-strong)] rounded bg-[var(--color-bg-elevated)]"
                  />
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Activo</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn btn-secondary flex-1 sm:flex-none justify-center">Actualizar Nodo</button>
                <button type="button" onClick={resetFormularioNodo} className="btn btn-outline flex-1 sm:flex-none justify-center">Cancelar</button>
                <button type="button" onClick={handleDeleteNodo} className="btn btn-danger flex-1 sm:flex-none justify-center">Eliminar Nodo</button>
              </div>
            </div>
          )}

          {/* Editing Edge */}
          {edgeEditandoId && !nodoEditandoId && (
            <div className="flex flex-col gap-3 flex-wrap">
              <div className="flex gap-3">
                <div className="w-24">
                  <label className="label">Número</label>
                  <input
                    type="number"
                    min="1"
                    value={formOrden}
                    onChange={(e) => setFormOrden(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="flex-1">
                  <label className="label">Nombre de la etiqueta</label>
                  <input
                    type="text"
                    placeholder="ej: Soporte"
                    value={formEtiqueta}
                    onChange={(e) => setFormEtiqueta(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleSubmitEdge} className="btn btn-tertiary flex-1 sm:flex-none justify-center">Guardar Opción</button>
                <button type="button" onClick={() => { setEdgeEditandoId(null); setFormEtiqueta(''); setFormOrden(1); }} className="btn btn-outline flex-1 sm:flex-none justify-center">Cancelar</button>
                <button type="button" onClick={handleDeleteEdge} className="btn btn-danger flex-1 sm:flex-none justify-center">Eliminar Conexión</button>
              </div>
            </div>
          )}

          {/* Creating New Node */}
          {!nodoEditandoId && !edgeEditandoId && (
            <div className="flex flex-col gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="label">Código único <span className="text-[var(--color-danger-base)]">*</span></label>
                <input
                  type="text"
                  placeholder="ej: menu_principal"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div className="flex-1 min-w-[280px]">
                <label className="label">Contenido / Mensaje <span className="text-[var(--color-danger-base)]">*</span></label>
                <textarea
                  rows="7"
                  placeholder="Mensaje que enviará el bot..."
                  value={formContenido}
                  onChange={(e) => setFormContenido(e.target.value)}
                  className="input message-textarea"
                  required
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="label">Tipo</label>
                <select
                  value={formTipo}
                  onChange={(e) => setFormTipo(e.target.value)}
                  className="input"
                >
                  {NODOS_TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <p className="node-type-help">{NODOS_TIPOS.find((tipo) => tipo.value === formTipo)?.description}</p>
              </div>
              {formTipo === 'FINAL' && (
                <div className="w-full">
                  <label className="label">Bandeja del caso final</label>
                  <select value={formBandejaDestino} onChange={(e) => setFormBandejaDestino(e.target.value)} className="input">
                    {BANDEJAS_FINALES.map((bandeja) => <option key={bandeja.value} value={bandeja.value}>{bandeja.label}</option>)}
                  </select>
                </div>
              )}
              <div className="w-full sm:w-28 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={formActivo}
                    onChange={(e) => setFormActivo(e.target.checked)}
                    className="w-4 h-4 accent-[var(--color-brand-primary)] border-[var(--color-border-strong)] rounded bg-[var(--color-bg-elevated)]"
                  />
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Activo</span>
                </label>
              </div>
              <button type="button" onClick={limpiarSeleccion} className="btn btn-outline flex-1 sm:flex-none justify-center self-end sm:self-center">
                Nuevo nodo
              </button>
              <button type="submit" className="btn btn-primary flex-1 sm:flex-none justify-center self-end sm:self-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Crear Nodo Nuevo
              </button>
            </div>
          )}
        </form>

        {/* Canvas */}
        <div className="flow-editor-canvas flex-1 card relative overflow-hidden animate-fade-in">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeDragStop={handleNodeDragStop}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            connectionMode="loose"
            nodeTypes={{ custom: NodoPersonalizado }}
            edgeTypes={{ 'custom-edge': EdgeConEtiqueta }}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            attributionPosition="bottom-left"
          >
            <Controls
              className="bg-[var(--color-bg-card)] border-[var(--color-border-strong)] text-[var(--color-text-primary)] shadow-lg"
            />
            <Background color="var(--color-border-strong)" gap={20} size={1} />
          </ReactFlow>

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="empty-state absolute inset-0 pointer-events-none">
              <div className="empty-state-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="empty-state-title">Lienzo vacío</h3>
              <p className="empty-state-text">Usa el formulario superior → "Crear Nodo Nuevo" para empezar</p>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>El primer nodo debe tener código: <code className="px-1 rounded bg-[var(--color-bg-base)] font-mono text-[var(--color-brand-primary)]">menu_principal</code></p>
            </div>
          )}
        </div>
        </div>

        </div>
      </div>
      </main>
    </div>
  );
}