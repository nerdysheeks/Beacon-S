import { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { sha256 } from '../../utils/crypto';
import './Simulator.css';

const NODE_TYPES = {
  SURVIVOR: 'survivor',
  DRONE: 'drone',
  EDGE_HUB: 'edgeHub'
};

const RANGE = 250; // pixels

function Simulator() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeCounter, setNodeCounter] = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);

  // Calculate distance between two nodes
  const calculateDistance = (node1, node2) => {
    const dx = node1.position.x - node2.position.x;
    const dy = node1.position.y - node2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Update edges based on node proximity
  const updateEdges = useCallback((updatedNodes) => {
    const newEdges = [];
    
    for (let i = 0; i < updatedNodes.length; i++) {
      for (let j = i + 1; j < updatedNodes.length; j++) {
        const distance = calculateDistance(updatedNodes[i], updatedNodes[j]);
        
        if (distance <= RANGE) {
          newEdges.push({
            id: `${updatedNodes[i].id}-${updatedNodes[j].id}`,
            source: updatedNodes[i].id,
            target: updatedNodes[j].id,
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 }
          });
        }
      }
    }
    
    setEdges(newEdges);
  }, [setEdges]);

  // Handle node drag
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    
    // Update edges when nodes move
    const moveChange = changes.find(c => c.type === 'position' && c.dragging);
    if (moveChange) {
      setNodes((nds) => {
        const updatedNodes = nds.map(node => {
          if (node.id === moveChange.id && moveChange.position) {
            return { ...node, position: moveChange.position };
          }
          return node;
        });
        updateEdges(updatedNodes);
        return updatedNodes;
      });
    }
  }, [onNodesChange, setNodes, updateEdges]);

  // Add node
  const addNode = (type) => {
    const id = `${type}-${nodeCounter}`;
    const newNode = {
      id,
      type: 'default',
      position: { x: 100 + nodeCounter * 50, y: 100 + nodeCounter * 30 },
      data: {
        label: getNodeLabel(type, id),
        type,
        messages: type === NODE_TYPES.SURVIVOR ? generateSampleMessages() : [],
        hash: null,
        tampered: false
      },
      style: getNodeStyle(type)
    };
    
    setNodes((nds) => {
      const updated = [...nds, newNode];
      updateEdges(updated);
      return updated;
    });
    setNodeCounter(nodeCounter + 1);
  };

  const getNodeLabel = (type, id) => {
    switch (type) {
      case NODE_TYPES.SURVIVOR:
        return `👥 Survivor\n${id}`;
      case NODE_TYPES.DRONE:
        return `🚁 Drone\n${id}`;
      case NODE_TYPES.EDGE_HUB:
        return `📡 Edge Hub\n${id}`;
      default:
        return id;
    }
  };

  const getNodeStyle = (type) => {
    const baseStyle = {
      padding: 20,
      borderRadius: 8,
      border: '2px solid',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'pre-line',
      textAlign: 'center'
    };

    switch (type) {
      case NODE_TYPES.SURVIVOR:
        return { ...baseStyle, background: '#3b82f6', borderColor: '#2563eb', color: 'white' };
      case NODE_TYPES.DRONE:
        return { ...baseStyle, background: '#8b5cf6', borderColor: '#7c3aed', color: 'white' };
      case NODE_TYPES.EDGE_HUB:
        return { ...baseStyle, background: '#10b981', borderColor: '#059669', color: 'white' };
      default:
        return baseStyle;
    }
  };

  const generateSampleMessages = () => [
    'Need medical supplies',
    'Water running low',
    'Location: Shelter A'
  ];

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // DTN: Collect messages from survivor
  const collectMessages = async () => {
    if (!selectedNode || selectedNode.data.type !== NODE_TYPES.DRONE) {
      alert('Select a drone first');
      return;
    }

    setNodes((nds) => {
      return nds.map(node => {
        if (node.id === selectedNode.id) {
          // Find nearby survivors
          const survivors = nds.filter(n => 
            n.data.type === NODE_TYPES.SURVIVOR &&
            calculateDistance(node, n) <= RANGE &&
            n.data.messages.length > 0
          );

          if (survivors.length === 0) {
            alert('No survivors in range with messages');
            return node;
          }

          // Collect messages from first survivor
          const survivor = survivors[0];
          const messages = [...survivor.data.messages];
          
          // Calculate hash
          sha256(JSON.stringify(messages)).then(hash => {
            setNodes((nds2) => nds2.map(n => {
              if (n.id === node.id) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    messages,
                    hash,
                    tampered: false
                  }
                };
              }
              return n;
            }));
          });

          // Clear survivor messages
          setNodes((nds2) => nds2.map(n => {
            if (n.id === survivor.id) {
              return { ...n, data: { ...n.data, messages: [] } };
            }
            return n;
          }));

          alert(`Collected ${messages.length} messages from ${survivor.id}`);
          return node;
        }
        return node;
      });
    });
  };

  // DTN: Deliver messages to edge hub
  const deliverMessages = async () => {
    if (!selectedNode || selectedNode.data.type !== NODE_TYPES.DRONE) {
      alert('Select a drone first');
      return;
    }

    if (!selectedNode.data.messages || selectedNode.data.messages.length === 0) {
      alert('Drone has no messages to deliver');
      return;
    }

    setNodes((nds) => {
      return nds.map(node => {
        if (node.id === selectedNode.id) {
          // Find nearby edge hubs
          const hubs = nds.filter(n => 
            n.data.type === NODE_TYPES.EDGE_HUB &&
            calculateDistance(node, n) <= RANGE
          );

          if (hubs.length === 0) {
            alert('No edge hub in range');
            return node;
          }

          const hub = hubs[0];
          const messages = [...node.data.messages];
          const originalHash = node.data.hash;

          // Verify integrity
          sha256(JSON.stringify(messages)).then(currentHash => {
            const verified = currentHash === originalHash && !node.data.tampered;
            
            setNodes((nds2) => nds2.map(n => {
              if (n.id === hub.id) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    messages,
                    verified,
                    originalHash,
                    currentHash
                  }
                };
              }
              return n;
            }));

            alert(`Delivered ${messages.length} messages to ${hub.id}\nIntegrity: ${verified ? '✅ VERIFIED' : '❌ TAMPERED'}`);
          });

          // Clear drone messages
          return {
            ...node,
            data: {
              ...node.data,
              messages: [],
              hash: null,
              tampered: false
            }
          };
        }
        return node;
      });
    });
  };

  // Tamper with drone data
  const tamperData = () => {
    if (!selectedNode || selectedNode.data.type !== NODE_TYPES.DRONE) {
      alert('Select a drone first');
      return;
    }

    if (!selectedNode.data.messages || selectedNode.data.messages.length === 0) {
      alert('Drone has no messages to tamper with');
      return;
    }

    setNodes((nds) => nds.map(node => {
      if (node.id === selectedNode.id) {
        const tamperedMessages = [...node.data.messages];
        tamperedMessages[0] = tamperedMessages[0] + ' [MODIFIED]';
        
        return {
          ...node,
          data: {
            ...node.data,
            messages: tamperedMessages,
            tampered: true
          }
        };
      }
      return node;
    }));

    alert('Data tampered! Hash verification will fail on delivery.');
  };

  return (
    <div className="simulator-container">
      <div className="simulator-header">
        <h2>🌐 Beacon-Sim</h2>
        <div className="controls-panel">
          <button onClick={() => addNode(NODE_TYPES.SURVIVOR)}>Add Survivor</button>
          <button onClick={() => addNode(NODE_TYPES.DRONE)}>Add Drone</button>
          <button onClick={() => addNode(NODE_TYPES.EDGE_HUB)}>Add Edge Hub</button>
        </div>
      </div>

      <div className="simulator-content">
        <div className="flow-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <div className="info-panel">
          <h3>Network Info</h3>
          <p>Range: {RANGE}px</p>
          <p>Nodes: {nodes.length}</p>
          <p>Connections: {edges.length}</p>
          
          {selectedNode && (
            <div className="node-info">
              <h4>Selected: {selectedNode.id}</h4>
              <p>Type: {selectedNode.data.type}</p>
              
              {selectedNode.data.messages && selectedNode.data.messages.length > 0 && (
                <div className="messages-info">
                  <strong>Messages ({selectedNode.data.messages.length}):</strong>
                  <ul>
                    {selectedNode.data.messages.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                  {selectedNode.data.hash && (
                    <p className="hash">Hash: {selectedNode.data.hash.substring(0, 16)}...</p>
                  )}
                </div>
              )}

              {selectedNode.data.verified !== undefined && (
                <div className={`verification ${selectedNode.data.verified ? 'verified' : 'tampered'}`}>
                  {selectedNode.data.verified ? '✅ VERIFIED - INTEGRITY OK' : '❌ TAMPERED - DATA CORRUPT'}
                </div>
              )}

              {selectedNode.data.type === NODE_TYPES.DRONE && (
                <div className="drone-actions">
                  <button onClick={collectMessages}>Collect Messages</button>
                  <button onClick={deliverMessages}>Deliver Messages</button>
                  <button onClick={tamperData} className="danger">Tamper Data</button>
                </div>
              )}
            </div>
          )}

          <div className="instructions">
            <h4>Instructions:</h4>
            <ol>
              <li>Add nodes using buttons above</li>
              <li>Drag nodes - edges auto-connect in range</li>
              <li>Click drone, move near survivor, click "Collect"</li>
              <li>Move drone near edge hub, click "Deliver"</li>
              <li>Try "Tamper Data" to break integrity</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Simulator;
