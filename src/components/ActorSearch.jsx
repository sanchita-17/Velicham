import React, { useState } from 'react';
import { fetchActorIntelligence } from '../services/api';

export default function ActorSearch() {
  const [handle, setHandle] = useState('');
  const [actorData, setActorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setError(null);
    setActorData(null);

    try {
      const data = await fetchActorIntelligence(handle);
      setActorData(data);
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to fetch threat actor intelligence from backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#0f172a', borderRadius: '8px' }}>
      <h2>Velicham Intelligence Search</h2>
      
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter threat handle (e.g. DarkKnight)..."
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          style={{ padding: '8px 12px', width: '300px', marginRight: '10px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff' }}
        />
        <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Search Actor
        </button>
      </form>

      {loading && <p>Querying Velicham Core Engine...</p>}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {actorData && (
        <div style={{ border: '1px solid #334155', padding: '16px', borderRadius: '6px', backgroundColor: '#1e293b' }}>
          <h3 style={{ color: '#38bdf8' }}>Target: {actorData.handle}</h3>
          <p><strong>PGP Key ID:</strong> <code>{actorData.pgp_key_id}</code></p>
          <p><strong>Wallet:</strong> <code>{actorData.wallet}</code></p>
          <p><strong>Risk Score:</strong> {actorData.risk_score}%</p>
          <p><strong>Status:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{actorData.status}</span></p>
        </div>
      )}
    </div>
  );
}