'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AppTopbar from '@/components/AppTopbar';

const stageOrder = ['collection', 'sorting', 'processing', 'recovery'];

export default function DigitalTwinPage() {
  const [summary, setSummary] = useState({ total_items: 0, total_weight: 0, stages: {}, destinations: {}, category_counts: {} });
  const [flow, setFlow] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadTwin() {
    try {
      const [summaryData, flowData, eventsData] = await Promise.all([
        api.twinSummary(),
        api.twinFlow(),
        api.twinEvents(),
      ]);
      setSummary(summaryData || { total_items: 0, total_weight: 0, stages: {}, destinations: {}, category_counts: {} });
      setFlow(flowData.flow || []);
      setEvents(eventsData.events || []);
    } catch (error) {
      console.error('Twin load failed', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTwin(); }, []);

  const handleMove = async (materialId, nextStage) => {
    try {
      await api.moveMaterial({ material_id: materialId, next_stage: nextStage });
      loadTwin();
    } catch (error) {
      console.error(error);
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
          <a href="/digital-twin" className="nav-link active">Digital Twin</a>
          <a href="/ai-assistant" className="nav-link">EcoGuide AI</a>
          <a href="/analytics" className="nav-link">Analytics</a>
        </nav>
      </aside>

      <main className="main-panel">
        <AppTopbar title="Digital twin facility" subtitle="Material movement, in real time" />
        {loading ? <div>Loading facility...</div> : (
          <>
            <div className="grid-three" style={{ marginTop: 20 }}>
              <div className="card metric-card"><div className="metric-label">Total items</div><div className="metric-value">{summary.total_items}</div></div>
              <div className="card metric-card"><div className="metric-label">Estimated weight</div><div className="metric-value">{summary.total_weight?.toFixed ? summary.total_weight.toFixed(2) : summary.total_weight} kg</div></div>
              <div className="card metric-card"><div className="metric-label">Recovery rate</div><div className="metric-value">{summary.recovery_rate || 0}%</div></div>
            </div>

            <div className="card chart-box" style={{ marginTop: 24 }}>
              <div className="panel-header">
                <h3>Virtual recycling facility</h3>
              </div>
              <div className="stage-grid">
                {stageOrder.map((stage) => (
                  <div key={stage} className="stage-card">
                    <div style={{ textTransform: 'capitalize', fontWeight: 700 }}>{stage}</div>
                    <div className="stage-fill"><div style={{ width: `${Math.min((flow.filter((row) => row.stage === stage).length / Math.max(flow.length, 1)) * 100, 100)}%` }} /></div>
                    <div style={{ marginTop: 12, fontSize: 14, color: '#475569' }}>{flow.filter((row) => row.stage === stage).length} items</div>
                    <ul className="table-list" style={{ marginTop: 12 }}>
                      {flow.filter((row) => row.stage === stage).slice(0, 4).map((row) => (
                        <li key={row.id}><strong>{row.label}</strong> • {row.category}</li>
                      ))}
                    </ul>
                    {stage !== 'recovery' && (
                      <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={() => handleMove(flow.find((item) => item.stage === stage)?.id, stageOrder[stageOrder.indexOf(stage)+1])}>
                        Move to next stage
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid-two" style={{ marginTop: 24 }}>
              <div className="card chart-box">
                <h3>Recent movement events</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  {events.length ? events.map((event) => (
                    <div key={event.id} className="event-item">
                      <strong>{event.event_type}</strong>
                      <div>{event.message}</div>
                      <small style={{ color: '#64748b' }}>{new Date(event.created_at).toLocaleString()}</small>
                    </div>
                  )) : <div>No movement events yet.</div>}
                </div>
              </div>

              <div className="card chart-box">
                <h3>Material flow summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16 }}>
                  {Object.entries(summary.destinations || {}).map(([key, value]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                        <strong>{value}</strong>
                      </div>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min((value / Math.max(summary.total_items, 1)) * 100, 100)}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
