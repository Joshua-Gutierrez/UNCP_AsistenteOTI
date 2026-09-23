import { useState, useCallback } from 'react';
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Nodos iniciales de prueba (representan las opciones del bot)
const initialNodes = [
    { id: '1', position: { x: 50, y: 50 }, data: { label: 'Mensaje de Bienvenida: Hola, ¿en qué podemos ayudarte?' }, type: 'default' },
    { id: '2', position: { x: 350, y: 150 }, data: { label: 'Opción 1: Matrícula y Trámites ADESA' }, type: 'default' },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2', animated: true }];

export default function FlowCanvas() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        []
    );

    return (
        <div className="w-full h-[600px] bg-[var(--color-bg-base)] rounded-xl border border-[var(--color-border-strong)] overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <Controls />
                <Background color="var(--color-border-strong)" gap={16} />
            </ReactFlow>
        </div>
    );
}