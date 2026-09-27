import axios from 'axios';

// Axios instance configured to communicate with your FastAPI backend
const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Fetch Threat Actor Intelligence
export const fetchActorIntelligence = async (handle) => {
  const response = await API.get(`/api/actors/${handle}`);
  return response.data;
};
// Add to src/services/api.js

// 2. Capture Evidentiary Snapshot
export const captureSnapshot = async (sourceUrl, rawText) => {
  const response = await API.post('/api/snapshots/capture', {
    source_url: sourceUrl,
    raw_text: rawText,
  });
  return response.data;
};

// 3. AI Stylometry Analysis Call
export const analyzeStylometry = async (sampleA, sampleB) => {
  const response = await API.post('/api/stylometry/analyze', {
    sample_a: sampleA,
    sample_b: sampleB,
  });
  return response.data;
};

export default API;