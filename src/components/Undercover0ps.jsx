import React, { useState, useEffect } from 'react';

export default function UndercoverOps() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [tokens, setTokens] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Automatically start the undercover operation and make the AI speak first on load
  useEffect(() => {
    const startUndercoverOp = async (targetHandle = "DarkKnight") => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/agent/initiate-contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_handle: targetHandle }),
        });
        const data = await response.json();
        setMessages(data.history || []);
      } catch (error) {
        console.error("Failed to initialize contact:", error);
      }
    };

    startUndercoverOp();

    // Fetch deployed honeytokens on load
    fetch('http://localhost:8000/api/honeytokens/list')
      .then(res => res.json())
      .then(data => setTokens(data))
      .catch(err => console.error("Failed to load honeytokens:", err));
      
    // Poll for triggered traps/beacons
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:8000/api/trap/alerts');
        const data = await res.json();
        setAlerts(data);
      } catch (err) {
        console.error("Failed to poll alerts:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const res = await fetch('http://localhost:8000/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(data.history);
      setInput('');
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const createToken = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/honeytokens/generate?name=AWS_Prod_Key&token_type=Cloud_Creds', {
        method: 'POST'
      });
      const newToken = await res.json();
      setTokens([...tokens, newToken]);
    } catch (error) {
      console.error("Failed to generate token:", error);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      
      {/* Left Column: AI Undercover Chat Simulation */}
      <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #1f2937' }}>
        <h2 style={{ color: '#38bdf8', marginTop: 0, fontSize: '18px' }}>Autonomous Undercover Agent</h2>
        <p style={{ color: '#9ca3af', fontSize: '12px' }}>Simulating real-time AI negotiation with darknet actors to protect human agents.</p>
        
        <div style={{ height: '250px', overflowY: 'auto', backgroundColor: '#030712', padding: '12px', borderRadius: '6px', border: '1px solid #374151', marginBottom: '12px' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ marginBottom: '8px', fontSize: '13px' }}>
              <strong style={{ color: m.sender === 'Criminal' ? '#ef4444' : '#38bdf8' }}>{m.sender}: </strong>
              <span style={{ color: '#f3f4f6' }}>{m.text}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Simulate criminal message..." 
            value={input} 
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, padding: '8px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px' }}
          />
          <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
        </form>
      </div>

      {/* Right Column: Honeytokens & Live Radar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Honeytoken Vault */}
        <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ color: '#f59e0b', margin: 0, fontSize: '18px' }}>Honeytoken Vault</h2>
            <button onClick={createToken} style={{ padding: '6px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Generate Token</button>
          </div>
          {tokens.map(t => (
            <div key={t.id} style={{ backgroundColor: '#030712', padding: '10px', borderRadius: '4px', border: '1px solid #374151', marginBottom: '8px', fontSize: '12px' }}>
              <div><strong>{t.name}</strong> ({t.type})</div>
              <code style={{ color: '#38bdf8' }}>{t.secret}</code>
            </div>
          ))}
        </div>

        {/* Live Attack Radar */}
        <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '8px', border: '1px solid #ef4444' }}>
          <h2 style={{ color: '#ef4444', margin: '0 0 12px 0', fontSize: '18px' }}>De-anonymization Radar</h2>
          {alerts.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center', padding: '10px' }}>Waiting for trap engagement...</div>
          ) : (
            alerts.map((a, i) => (
              <div key={i} style={{ backgroundColor: '#450a0a', padding: '10px', borderRadius: '4px', fontSize: '12px', color: '#fca5a5' }}>
                <div><strong>IP Captured:</strong> {a.ip}</div>
                <div><strong>Device:</strong> {a.device}</div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}