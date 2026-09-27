import React, { useState, useEffect } from 'react';
import { fetchActorIntelligence, captureSnapshot, analyzeStylometry } from './services/api';
import EntityGraph from './components/EntityGraph';
import CriminalHeatmap from './components/ActivityHeatmap';

export default function App() {
  const [activeTab, setActiveTab] = useState('actors');

  // Threat Actor Search API State (Currently unused in UI but preserved)
  const [handleQuery, setHandleQuery] = useState('');
  const [actorData, setActorData] = useState(null);
  const [loadingActor, setLoadingActor] = useState(false);
  const [actorError, setActorError] = useState(null);

  // Stylometry State
  const [sampleA, setSampleA] = useState('');
  const [sampleB, setSampleB] = useState('');
  const [stylometryResult, setStylometryResult] = useState(null);

  // Snapshot State
  const [sourceUrl, setSourceUrl] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [snapshotResult, setSnapshotResult] = useState(null);

  // Undercover Ops & Honeytoken State
  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [tokenName, setTokenName] = useState('');
  const [tokenType, setTokenType] = useState('AWS');
  const [generatedToken, setGeneratedToken] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Local Registry State (Updated with threatLevel and notes)
  const [globalRegistry, setGlobalRegistry] = useState([
    { id: 1, handle: 'DarkKnight', threatLevel: 'Active Threat', wallet: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', ip: '192.168.1.100', pgp: '0x4A8...9F', notes: 'Known ransomware operator.' },
    { id: 2, handle: 'Ghost_Rider', threatLevel: 'Under Investigation', wallet: '', ip: '10.0.0.55', pgp: '0xB71...2C', notes: 'Spotted on new dark web forum.' }
  ]);

  const [formData, setFormData] = useState({ id: null, handle: '', threatLevel: 'Unknown', wallet: '', ip: '', pgp: '', notes: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchThreatLevel, setSearchThreatLevel] = useState('All');

  // CRUD Functions
  const handleSaveCriminal = (e) => {
    e.preventDefault();
    if (isEditing) {
      setGlobalRegistry(globalRegistry.map(c => c.id === formData.id ? formData : c));
      setIsEditing(false);
    } else {
      setGlobalRegistry([...globalRegistry, { ...formData, id: Date.now() }]);
    }
    setFormData({ id: null, handle: '', threatLevel: 'Unknown', wallet: '', ip: '', pgp: '', notes: '' }); 
  };

  const handleEdit = (criminal) => {
    setFormData(criminal);
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    setGlobalRegistry(globalRegistry.filter(c => c.id !== id));
  };

  const getThreatColor = (level) => {
    switch(level) {
      case 'Active Threat': return '#ef4444'; // Red
      case 'Under Investigation': return '#f59e0b'; // Amber
      case 'Previous Threat': return '#3b82f6'; // Blue
      default: return '#6b7280'; // Gray (Unknown)
    }
  };

  // Combined Filter Logic
  const filteredRegistry = globalRegistry.filter(criminal => {
    const matchesSearch = 
      criminal.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (criminal.ip && criminal.ip.includes(searchQuery)) ||
      (criminal.wallet && criminal.wallet.includes(searchQuery)) ||
      (criminal.pgp && criminal.pgp.includes(searchQuery));
      
    const matchesLevel = searchThreatLevel === 'All' || criminal.threatLevel === searchThreatLevel;
    
    return matchesSearch && matchesLevel;
  });

  // Handle Stylometry Analysis
  const handleStylometryAnalysis = async (e) => {
    e.preventDefault();
    if (!sampleA || !sampleB) {
      alert("Please enter text into both sample boxes.");
      return;
    }

    try {
      const data = await analyzeStylometry(sampleA, sampleB);
      setStylometryResult(data);
    } catch (err) {
      console.error("Stylometry Error:", err);
      alert("Stylometry API request failed. Ensure backend is running on port 8000.");
    }
  };

  // Handle Snapshot Capture
  const handleSnapshotCapture = async (e) => {
    e.preventDefault();
    if (!sourceUrl || !rawContent) return;

    try {
      const data = await captureSnapshot(sourceUrl, rawContent);
      setSnapshotResult(data);
    } catch (err) {
      alert("Failed to create snapshot.");
    }
  };

  // Handle Undercover Agent Chat API Call
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessageText = inputMessage;
    setInputMessage('');

    setChatHistory(prev => [
      ...prev, 
      { sender: 'Criminal', text: userMessageText }
    ]);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessageText }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || `Server Error: ${response.status}`);
      }

      if (data.history && Array.isArray(data.history)) {
        setChatHistory(data.history);
      } else {
        const agentReplyText = data.reply || data.message || data.response || "No reply key found";
        setChatHistory(prev => [
          ...prev, 
          { sender: 'Agent', text: agentReplyText }
        ]);
      }
    } catch (error) {
      console.error("Error communicating with undercover agent:", error);
      setChatHistory(prev => [
        ...prev, 
        { sender: 'Agent', text: `[Backend Error]: ${error.message}` }
      ]);
    }
  };

  // Handle Honeytoken Generation API Call
  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!tokenName.trim()) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/honeytokens/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName, token_type: tokenType })
      });
      const data = await response.json();
      setGeneratedToken(data);
    } catch (error) {
      console.error("Error generating honeytoken:", error);
    }
  };

  // Load active session / initiate contact on startup
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/agent/initiate-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_handle: "DarkKnight" })
    })
      .then(res => res.json())
      .then(data => {
        if (data.history) setChatHistory(data.history);
      })
      .catch(err => console.error("Failed to initiate contact:", err));
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#f3f4f6', fontFamily: 'monospace, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ borderBottom: '1px solid #1f2937', padding: '16px 32px', backgroundColor: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#38bdf8', letterSpacing: '0.08em', fontWeight: 'bold' }}>
            VELICHAM <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'normal' }}>| Threat Intelligence & OSINT Platform (SIH26151)</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#22c55e', backgroundColor: '#064e3b', padding: '4px 12px', borderRadius: '12px', border: '1px solid #059669' }}>
            ● FastAPI Engine Live (:8000)
          </span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '4px', padding: '12px 32px 0 32px', borderBottom: '1px solid #1f2937', backgroundColor: '#0b0f19', flexWrap: 'wrap' }}>
        {[
          { id: 'actors', label: 'Threat Actor Lookup' },
          { id: 'heatmap', label: 'Activity Heatmap' },
          { id: 'stylometry', label: 'AI Stylometry Engine' },
          { id: 'graph', label: 'Entity Graph & Infrastructure' },
          { id: 'snapshots', label: 'Evidence Forensics Capture' },
          { id: 'undercover', label: '🛡️ Undercover Ops & Honeytokens' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? '#1f2937' : 'transparent',
              color: activeTab === tab.id ? '#38bdf8' : '#9ca3af',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              borderRadius: '6px 6px 0 0',
              fontSize: '13px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content Dashboard */}
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* TAB 1: THREAT ACTOR REGISTRY (CRUD) */}
        {activeTab === 'actors' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <h2 style={{ marginTop: 0, color: '#38bdf8', fontSize: '18px' }}>
                {isEditing ? 'Edit Threat Actor' : 'Add New Threat Actor'}
              </h2>
              <form onSubmit={handleSaveCriminal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input placeholder="Handle (e.g. DarkKnight)" value={formData.handle} onChange={e => setFormData({...formData, handle: e.target.value})} required style={{ padding: '8px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151' }}/>
                
                <select 
                  value={formData.threatLevel || 'Unknown'} 
                  onChange={e => setFormData({...formData, threatLevel: e.target.value})}
                  style={{ padding: '8px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', outline: 'none' }}
                >
                  <option value="Unknown">Unknown Status</option>
                  <option value="Active Threat">Active Threat</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Previous Threat">Previous Threat</option>
                </select>

                <input placeholder="BTC Wallet Address" value={formData.wallet} onChange={e => setFormData({...formData, wallet: e.target.value})} style={{ padding: '8px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151' }}/>
                <input placeholder="Known IP Address" value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} style={{ padding: '8px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151' }}/>
                <input placeholder="PGP Key ID" value={formData.pgp} onChange={e => setFormData({...formData, pgp: e.target.value})} style={{ padding: '8px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151' }}/>
                
                <textarea 
                  placeholder="Operational notes..." 
                  value={formData.notes || ''} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  rows="3"
                  style={{ padding: '8px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', resize: 'vertical' }}
                />
                
                <button type="submit" style={{ padding: '10px', backgroundColor: isEditing ? '#f59e0b' : '#22c55e', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px', borderRadius: '4px' }}>
                  {isEditing ? 'Update Actor Record' : 'Save New Actor'}
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <h2 style={{ marginTop: 0, color: '#38bdf8', fontSize: '18px', marginBottom: '16px' }}>Active Intelligence Registry</h2>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <input 
                  type="text"
                  placeholder="Search handle, IP, wallet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px' }}
                />
                <select 
                  value={searchThreatLevel} 
                  onChange={e => setSearchThreatLevel(e.target.value)}
                  style={{ padding: '10px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px' }}
                >
                  <option value="All">All Threat Levels</option>
                  <option value="Active Threat">Active Threat</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Previous Threat">Previous Threat</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              
              {filteredRegistry.map(criminal => (
                <div key={criminal.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: '#030712', border: '1px solid #374151', marginBottom: '12px', borderRadius: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, color: '#ef4444' }}>{criminal.handle}</h3>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: getThreatColor(criminal.threatLevel), color: '#fff', fontWeight: 'bold' }}>
                        {criminal.threatLevel || 'Unknown'}
                      </span>
                    </div>
                    
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#9ca3af' }}>Wallet: {criminal.wallet || 'Unknown'} | IP: {criminal.ip || 'Unknown'}</p>
                    
                    {criminal.notes && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#d1d5db', backgroundColor: '#1f2937', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #38bdf8' }}>
                        {criminal.notes}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginLeft: '16px' }}>
                    <button onClick={() => handleEdit(criminal)} style={{ padding: '6px 12px', backgroundColor: '#374151', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Edit</button>
                    <button onClick={() => handleDelete(criminal.id)} style={{ padding: '6px 12px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Delete</button>
                  </div>
                </div>
              ))}
              
              {filteredRegistry.length === 0 && (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                  No actors match your search criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1.5: ACTIVITY HEATMAP */}
        {activeTab === 'heatmap' && (
          <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #1f2937' }}>
            <CriminalHeatmap />
          </div>
        )}

        {/* TAB 2: AI STYLOMETRY ANALYSIS */}
        {activeTab === 'stylometry' && (
          <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #1f2937' }}>
            <h2 style={{ marginTop: 0, color: '#38bdf8', fontSize: '18px' }}>AI Stylometry & Author Attribution Engine</h2>
            <p style={{ color: '#9ca3af', fontSize: '13px' }}>
              De-anonymize threat actors by comparing writing style parameters across darknet forums.
            </p>

            <form onSubmit={handleStylometryAnalysis} style={{ marginTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#9ca3af' }}>Sample A (Known Threat Actor Post):</label>
                  <textarea
                    rows="6"
                    value={sampleA}
                    onChange={(e) => setSampleA(e.target.value)}
                    placeholder="Paste known darknet forum post text..."
                    style={{ width: '100%', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', padding: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#9ca3af' }}>Sample B (Anonymous Darknet Text):</label>
                  <textarea
                    rows="6"
                    value={sampleB}
                    onChange={(e) => setSampleB(e.target.value)}
                    placeholder="Paste suspect darknet post or ransom note..."
                    style={{ width: '100%', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', padding: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <button type="submit" style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Run Stylometric Match
              </button>
            </form>

            {stylometryResult && (
              <div style={{ marginTop: '24px', backgroundColor: '#030712', padding: '20px', borderRadius: '6px', border: '1px solid #0284c7' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#38bdf8' }}>Stylometry Match Lead: {stylometryResult.confidence}</h3>
                
                <blockquote style={{ margin: '0 0 16px 0', padding: '10px 16px', backgroundColor: '#1e1b4b', borderLeft: '4px solid #6366f1', color: '#c7d2fe', fontSize: '13px' }}>
                  <strong>Adversarial Warning:</strong> {stylometryResult.adversarial_warning}
                </blockquote>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '12px', backgroundColor: '#111827', padding: '12px', borderRadius: '4px' }}>
                  <div>Punctuation Match: <strong style={{ color: '#22c55e' }}>{stylometryResult.punctuation_match}</strong></div>
                  <div>Sentence Length Diff: <strong style={{ color: '#eab308' }}>{stylometryResult.sentence_length_diff}</strong></div>
                  <div>Vocab Richness: <strong style={{ color: '#38bdf8' }}>{stylometryResult.vocab_richness}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ENTITY GRAPH ENGINE */}
        {activeTab === 'graph' && (
          <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #1f2937' }}>
            <h2 style={{ marginTop: 0, color: '#38bdf8', fontSize: '18px' }}>Neo4j Entity & Infrastructure Graph Scanner</h2>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>
              Correlating PGP Keys, BTC/XMR Wallets, and Infrastructure Hops across nodes.
            </p>

            <EntityGraph defaultHandle="DarkKnight" />
          </div>
        )}

        {/* TAB 4: FORENSICS EVIDENCE SNAPSHOTS */}
        {activeTab === 'snapshots' && (
          <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #1f2937' }}>
            <h2 style={{ marginTop: 0, color: '#38bdf8', fontSize: '18px' }}>Forensic Evidence Capture (SHA-256)</h2>
            <p style={{ color: '#9ca3af', fontSize: '13px' }}>Generate court-admissible, forensically preserved snapshots with SHA-256 hashes.</p>

            <form onSubmit={handleSnapshotCapture} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#9ca3af' }}>Target Onion / Source URL:</label>
                <input
                  type="text"
                  placeholder="http://exploit.onion/thread/8492"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#9ca3af' }}>Raw HTML / Forum Post Content:</label>
                <textarea
                  rows="4"
                  placeholder="Paste raw forum HTML or post content to hash..."
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start' }}>
                Capture & Preserved Hash
              </button>
            </form>

            {snapshotResult && (
              <div style={{ marginTop: '20px', backgroundColor: '#030712', padding: '16px', borderRadius: '6px', border: '1px solid #22c55e' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#22c55e' }}>Status: {snapshotResult.status}</h4>
                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Snapshot ID:</strong> {snapshotResult.snapshot_id}</p>
                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>SHA-256 Hash:</strong> <code style={{ color: '#38bdf8' }}>{snapshotResult.sha256_hash}</code></p>
                <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>Timestamp (UTC):</strong> {snapshotResult.timestamp}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: UNDERCOVER OPS & HONEYTOKENS */}
        {activeTab === 'undercover' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Left Box: Undercover AI Agent Chat Simulator */}
            <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <h2 style={{ marginTop: 0, color: '#38bdf8', fontSize: '18px' }}>Undercover AI Operative</h2>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>Engage and stall simulated adversaries while dropping honeytoken traps.</p>
              
              <div style={{ background: '#030712', padding: '16px', borderRadius: '6px', minHeight: '220px', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px', border: '1px solid #374151' }}>
                {chatHistory.length === 0 ? (
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>
                    No messages yet. Simulate a hacker prompt below...
                  </div>
                ) : (
                  chatHistory.map((chat, index) => (
                    <div key={index} style={{ marginBottom: '10px', fontSize: '13px' }}>
                      <strong style={{ color: chat.sender === 'Criminal' ? '#f87171' : '#38bdf8' }}>{chat.sender}:</strong> 
                      <span style={{ color: '#e5e7eb', marginLeft: '6px' }}>{chat.text}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={inputMessage} 
                  onChange={(e) => setInputMessage(e.target.value)} 
                  placeholder="Simulate attacker message..."
                  style={{ flex: 1, padding: '10px', borderRadius: '4px', background: '#1f2937', color: '#fff', border: '1px solid #374151', fontSize: '13px' }}
                />
                <button type="submit" style={{ padding: '10px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Send
                </button>
              </form>
            </div>

            {/* Right Box: Honeytoken Vault Generator */}
            <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <h2 style={{ marginTop: 0, color: '#38bdf8', fontSize: '18px' }}>Honeytoken Vault</h2>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>Deploy canary tokens to detect unauthorized lateral movement.</p>

              <form onSubmit={handleGenerateToken} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <input 
                  type="text"
                  placeholder="Token Name (e.g. AWS_Prod_Creds)" 
                  value={tokenName} 
                  onChange={(e) => setTokenName(e.target.value)} 
                  required
                  style={{ padding: '10px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px', fontSize: '13px' }}
                />
                <select 
                  value={tokenType} 
                  onChange={(e) => setTokenType(e.target.value)}
                  style={{ padding: '10px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px', fontSize: '13px' }}
                >
                  <option value="AWS">AWS IAM Secret</option>
                  <option value="Database">Database Connection String</option>
                  <option value="API_Key">Private API Key</option>
                </select>
                <button type="submit" style={{ padding: '10px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Generate & Arm Honeytoken
                </button>
              </form>

              {generatedToken && (
                <div style={{ backgroundColor: '#030712', padding: '14px', borderRadius: '6px', border: '1px solid #22c55e', fontSize: '12px' }}>
                  <div style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '6px' }}>● {generatedToken.status}</div>
                  <div><strong>Name:</strong> {generatedToken.name}</div>
                  <div><strong>Type:</strong> {generatedToken.type}</div>
                  <div style={{ marginTop: '6px' }}><strong>Secret Payload:</strong></div>
                  <code style={{ color: '#38bdf8', display: 'block', backgroundColor: '#111827', padding: '6px', borderRadius: '4px', marginTop: '4px', wordBreak: 'break-all' }}>
                    {generatedToken.payload || "AKIA_CANARY_TEST_TOKEN_918237"}
                  </code>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}