import React, { useState, useRef, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function EntityGraph({ rawData, globalRegistry = [] }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 550 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local state for manually added entities
  const [newEntityType, setNewEntityType] = useState('wallet');
  const [newEntityVal, setNewEntityVal] = useState('');
  const [targetActor, setTargetActor] = useState('');
  const [localCustomNodes, setLocalCustomNodes] = useState([]);
  const [localCustomLinks, setLocalCustomLinks] = useState([]);

  // 1. Measure parent container dynamically to prevent 0px canvas crashes
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 800,
          height: 550
        });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Default fallback dataset if no external prop is provided
  const baseData = useMemo(() => {
    if (rawData && rawData.nodes?.length > 0) return rawData;

    if (globalRegistry && globalRegistry.length > 0) {
      const nodesMap = new Map();
      const links = [];

      globalRegistry.forEach(actor => {
        const actorId = actor.handle || actor.id;
        if (!nodesMap.has(actorId)) {
          nodesMap.set(actorId, { id: actorId, label: actorId, group: 'actor' });
        }

        const attrs = [
          { val: actor.wallet, group: 'wallet' },
          { val: actor.ip, group: 'ip' },
          { val: actor.pgp, group: 'pgp' }
        ];

        attrs.forEach(attr => {
          if (attr.val) {
            if (!nodesMap.has(attr.val)) {
              nodesMap.set(attr.val, { id: attr.val, label: attr.val, group: attr.group });
            }
            links.push({ source: actorId, target: attr.val });
          }
        });
      });

      return { nodes: Array.from(nodesMap.values()), links };
    }

    // Default sample data for instant preview
    return {
      nodes: [
        { id: 'DarkKnight', label: 'DarkKnight', group: 'actor' },
        { id: 'ZeroCool', label: 'ZeroCool', group: 'actor' },
        { id: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', label: '1A1zP... (BTC)', group: 'wallet' },
        { id: '192.168.1.100', label: '192.168.1.100 (IP)', group: 'ip' },
        { id: '0x4A8...9F', label: '0x4A8...9F (PGP)', group: 'pgp' }
      ],
      links: [
        { source: 'DarkKnight', target: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
        { source: 'DarkKnight', target: '192.168.1.100' },
        { source: 'ZeroCool', target: '192.168.1.100' }, // Shared IP correlation
        { source: 'ZeroCool', target: '0x4A8...9F' }
      ]
    };
  }, [rawData, globalRegistry]);

  // Combine Base Data + Local Added Entities safely
  const fullGraphData = useMemo(() => {
    const allNodes = [...baseData.nodes, ...localCustomNodes];
    const allLinks = [...baseData.links, ...localCustomLinks];

    // Helper to normalize node IDs (handles string IDs or ForceGraph object mutations)
    const getId = (node) => (typeof node === 'object' && node !== null ? node.id : node);

    // Track entity frequency to highlight Venn overlaps/shared infrastructure
    const connectionCounts = {};
    allLinks.forEach(link => {
      const targetId = getId(link.target);
      connectionCounts[targetId] = (connectionCounts[targetId] || 0) + 1;
    });

    const uniqueNodesMap = new Map();
    allNodes.forEach(n => {
      const nodeId = getId(n);
      uniqueNodesMap.set(nodeId, {
        ...n,
        id: nodeId,
        label: n.label || nodeId,
        isShared: (connectionCounts[nodeId] || 0) > 1 && n.group !== 'actor'
      });
    });

    const validNodeIds = new Set(uniqueNodesMap.keys());
    const validLinks = allLinks.filter(l => 
      validNodeIds.has(getId(l.source)) && validNodeIds.has(getId(l.target))
    ).map(l => ({
      source: getId(l.source),
      target: getId(l.target)
    }));

    return {
      nodes: Array.from(uniqueNodesMap.values()),
      links: validLinks
    };
  }, [baseData, localCustomNodes, localCustomLinks]);

  // 2. Search & Filter Logic
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return fullGraphData;

    const query = searchTerm.toLowerCase();
    const getId = (node) => (typeof node === 'object' && node !== null ? node.id : node);

    // Identify matching nodes (actors or attributes)
    const matchingNodeIds = new Set(
      fullGraphData.nodes
        .filter(n => n.id.toLowerCase().includes(query) || (n.label && n.label.toLowerCase().includes(query)))
        .map(n => n.id)
    );

    // Keep links connected to matching nodes
    const relevantNodeIds = new Set(matchingNodeIds);
    const filteredLinks = fullGraphData.links.filter(link => {
      const srcId = getId(link.source);
      const tgtId = getId(link.target);
      if (matchingNodeIds.has(srcId) || matchingNodeIds.has(tgtId)) {
        relevantNodeIds.add(srcId);
        relevantNodeIds.add(tgtId);
        return true;
      }
      return false;
    });

    const filteredNodes = fullGraphData.nodes.filter(n => relevantNodeIds.has(n.id));

    return { nodes: filteredNodes, links: filteredLinks };
  }, [fullGraphData, searchTerm]);

  // Handle adding new custom mapped entity
  const handleAddEntity = (e) => {
    e.preventDefault();
    if (!newEntityVal.trim()) return;

    const activeActor = targetActor.trim() || fullGraphData.nodes.find(n => n.group === 'actor')?.id || 'DarkKnight';
    const entityId = newEntityVal.trim();

    const newNode = { id: entityId, label: `${entityId} (${newEntityType.toUpperCase()})`, group: newEntityType };
    const newLink = { source: activeActor, target: entityId };

    setLocalCustomNodes(prev => [...prev, newNode]);
    setLocalCustomLinks(prev => [...prev, newLink]);
    setNewEntityVal('');
  };

  const actorList = useMemo(() => {
    return fullGraphData.nodes.filter(n => n.group === 'actor').map(n => n.id);
  }, [fullGraphData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '12px', backgroundColor: '#111827', borderRadius: '6px', border: '1px solid #1f2937' }}>
        
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="🔍 Search threat actors, IPs, wallets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#030712',
              color: '#f3f4f6',
              border: '1px solid #374151',
              borderRadius: '4px',
              outline: 'none'
            }}
          />
        </div>

        {/* Dynamic Add Data Form */}
        <form onSubmit={handleAddEntity} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={targetActor}
            onChange={(e) => setTargetActor(e.target.value)}
            style={{ padding: '8px', backgroundColor: '#030712', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '4px' }}
          >
            <option value="">Select Target Actor</option>
            {actorList.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={newEntityType}
            onChange={(e) => setNewEntityType(e.target.value)}
            style={{ padding: '8px', backgroundColor: '#030712', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '4px' }}
          >
            <option value="wallet">Crypto Wallet</option>
            <option value="ip">IP Address</option>
            <option value="pgp">PGP Key</option>
          </select>

          <input
            type="text"
            placeholder="Entity value..."
            value={newEntityVal}
            onChange={(e) => setNewEntityVal(e.target.value)}
            style={{ padding: '8px 12px', backgroundColor: '#030712', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '4px' }}
          />

          <button
            type="submit"
            style={{ padding: '8px 14px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Map Data
          </button>
        </form>
      </div>

      {/* Main Interactive Canvas Area */}
      <div ref={containerRef} style={{ width: '100%', minHeight: '550px', backgroundColor: '#030712', borderRadius: '6px', border: '1px solid #1f2937', position: 'relative', overflow: 'hidden' }}>
        
        {/* Legend Overlay */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, backgroundColor: 'rgba(17, 24, 39, 0.85)', padding: '10px', borderRadius: '6px', border: '1px solid #374151', fontSize: '12px', color: '#9ca3af' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#f3f4f6' }}>Network Mapping Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span> Threat Actor
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#38bdf8' }}></span> Wallet / IP / PGP
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }}></span> Shared Correlation (Shared IP/BTC)
          </div>
        </div>

        {/* Canvas Engine */}
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={filteredData}
          nodeAutoColorBy="group"
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.label || node.id;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;

            // Color selection logic
            let nodeColor = '#38bdf8'; // Blue for standard artifacts
            if (node.group === 'actor') nodeColor = '#ef4444'; // Red for Threat Actors
            if (node.isShared) nodeColor = '#eab308'; // Glowing Gold for Shared Artifacts

            // Draw Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.group === 'actor' ? 8 : 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = nodeColor;
            ctx.fill();

            // Draw Shared Highlight Ring
            if (node.isShared) {
              ctx.lineWidth = 2 / globalScale;
              ctx.strokeStyle = '#fef08a';
              ctx.stroke();
            }

            // Text Label
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#f3f4f6';
            ctx.fillText(label, node.x, node.y + 12);
          }}
          linkColor={() => '#374151'}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
        />
      </div>
    </div>
  );
}