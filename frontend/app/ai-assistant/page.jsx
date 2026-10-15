'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AppTopbar from '@/components/AppTopbar';

const quickPrompts = [
  'How can I reuse this item?',
  'How should I dispose of this waste?',
  'Analyze my recycling performance.',
  'How can I reduce waste?',
  'Suggest improvements for my facility.',
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'EcoGuide AI is ready. I can suggest reuse, disposal, and facility improvements based on your tracked waste data.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({ total_items: 0, dominant_category: 'recyclable', recovery_rate: 0 });

  useEffect(() => {
    async function loadContext() {
      try {
        const [materials, summary] = await Promise.all([api.getMaterials(), api.twinSummary()]);
        const catCounts = summary.category_counts || {};
        const dominant = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0] || ['recyclable', 0];
        setContext({
          total_items: materials.length,
          dominant_category: dominant[0],
          recovery_rate: summary.recovery_rate || 0,
        });
      } catch (error) {
        console.error('Failed to load AI context', error);
      }
    }
    loadContext();
  }, []);

  const sendMessage = async (promptOverride) => {
    const text = (promptOverride || input).trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const response = await api.aiChat({ message: text, context });
      setMessages((prev) => [...prev, { role: 'bot', text: response.response || 'No answer generated.' }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'bot', text: 'I could not reach the AI service. Using fallback guidance instead.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-badge">S</div>
          <div><div style={{fontWeight:800}}>Smart Recycling</div><small>Assistant</small></div>
        </div>
        <nav>
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/scanner" className="nav-link">Waste Scanner</a>
          <a href="/digital-twin" className="nav-link">Digital Twin</a>
          <a href="/ai-assistant" className="nav-link active">EcoGuide AI</a>
          <a href="/analytics" className="nav-link">Analytics</a>
        </nav>
      </aside>
      <main className="main-panel">
        <AppTopbar title="EcoGuide AI" subtitle="Recommendations grounded in your material data" />
        <div className="card chart-box" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {quickPrompts.map((prompt) => (
              <button key={prompt} className="btn btn-ghost" onClick={() => sendMessage(prompt)}>{prompt}</button>
            ))}
          </div>

          <div className="chat-box">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
                {message.text}
              </div>
            ))}
            {loading && <div className="message bot">Thinking...</div>}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <input className="input" style={{ flex: 1 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask EcoGuide AI about reuse, disposal, or facility improvements" />
            <button className="btn btn-primary" onClick={() => sendMessage()}>Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}
