'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Download } from 'lucide-react';
import AppTopbar from '@/components/AppTopbar';

const categories = [
  { key: 'recyclable', label: 'Recyclable', color: '#10b981' },
  { key: 'reusable', label: 'Reusable', color: '#3b82f6' },
  { key: 'biodegradable', label: 'Biodegradable', color: '#f59e0b' },
  { key: 'hazardous', label: 'Hazardous', color: '#ef4444' },
  { key: 'review', label: 'Needs review', color: '#94a3b8' },
];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({ category_counts: {}, daily_collection: [], stage_distribution: {}, recovery_rate: 0, items: [] });
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await api.analytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Analytics failed', error);
        setError('Unable to load analytics. Check that the backend is running.');
      }
    }
    loadAnalytics();
  }, []);

  const filteredItems = filter === 'all' ? analytics.items : analytics.items.filter((item) => item.waste_category === filter);
  const totalItems = Object.values(analytics.category_counts || {}).reduce((sum, value) => sum + value, 0);
  const activeCategories = categories
    .map((category) => ({ ...category, value: analytics.category_counts?.[category.key] || 0 }))
    .filter((category) => category.value > 0);
  const pieStops = [];
  let cumulativeDegrees = 0;
  activeCategories.forEach((category) => {
    const nextDegrees = cumulativeDegrees + (category.value / Math.max(totalItems, 1)) * 360;
    pieStops.push(`${category.color} ${cumulativeDegrees}deg ${nextDegrees}deg`);
    cumulativeDegrees = nextDegrees;
  });
  const pieStyle = pieStops.length ? { '--donut-gradient': `conic-gradient(${pieStops.join(', ')})` } : {};
  const dailyCollection = analytics.daily_collection || [];
  const dailyMax = Math.max(...dailyCollection.map((day) => categories.reduce((total, category) => total + (day[category.key] || 0), 0)), 1);
  const stageRows = Object.entries(analytics.stage_distribution || {});

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
          <a href="/ai-assistant" className="nav-link">EcoGuide AI</a>
          <a href="/analytics" className="nav-link active">Analytics</a>
        </nav>
      </aside>

      <main className="main-panel">
        <AppTopbar
          title="Waste analytics"
          subtitle="Evidence for a more circular operation"
          actions={<a className="btn btn-primary" href={api.exportCsv()}><Download size={16} style={{ marginRight: 8 }} />Export CSV</a>}
        />

        {error && <div className="event-item" role="alert" style={{ marginBottom: 18, color: '#b91c1c' }}>{error}</div>}

        <div className="grid-three">
          <div className="card metric-card"><div className="metric-label">Items tracked</div><div className="metric-value">{totalItems}</div></div>
          <div className="card metric-card"><div className="metric-label">Recovery rate</div><div className="metric-value">{analytics.recovery_rate || 0}%</div></div>
          <div className="card metric-card"><div className="metric-label">Material categories</div><div className="metric-value">{activeCategories.length}</div></div>
        </div>

        <div className="grid-two" style={{ marginTop: 24 }}>
          <div className="card chart-box">
            <div className="panel-header">
              <div><h3>Material mix</h3><small style={{ color: '#64748b' }}>Share of recorded items by category</small></div>
              <span className="eyebrow">Live data</span>
            </div>
            <div className="analytics-donut-wrap">
              <div className="analytics-donut" style={pieStyle} role="img" aria-label={`Pie chart of ${totalItems} recorded material items`}>
                <div className="analytics-donut-center"><strong>{totalItems}</strong><span>items</span></div>
              </div>
              <div className="chart-legend">
                {activeCategories.length ? activeCategories.map((category) => (
                  <div className="legend-row" key={category.key}>
                    <span className="legend-label"><i className="legend-swatch" style={{ background: category.color }} />{category.label}</span>
                    <strong>{category.value}</strong>
                  </div>
                )) : <div style={{ color: '#64748b', fontSize: '.85rem' }}>No material records yet.</div>}
              </div>
            </div>
          </div>

          <div className="card chart-box">
            <div className="panel-header">
              <div><h3>Collection trend</h3><small style={{ color: '#64748b' }}>Items recorded per day, last 7 days</small></div>
              <span className="eyebrow">Daily count</span>
            </div>
            {dailyCollection.length ? (
              <>
                <svg className="analytics-bars" viewBox="0 0 760 280" role="img" aria-label="Stacked bar graph of daily item collections by category">
                  {[0, 1, 2, 3].map((line) => {
                    const y = 215 - line * 54;
                    return <g key={line}><line className="chart-grid-line" x1="44" x2="748" y1={y} y2={y} /><text className="chart-axis-label" x="8" y={y + 4}>{Math.round(dailyMax * line / 3)}</text></g>;
                  })}
                  {dailyCollection.map((day, dayIndex) => {
                    const x = 58 + dayIndex * 98;
                    let stackY = 215;
                    return (
                      <g key={day.date}>
                        {categories.map((category, categoryIndex) => {
                          const count = day[category.key] || 0;
                          const height = (count / dailyMax) * 160;
                          stackY -= height;
                          return count ? (
                            <rect
                              key={category.key}
                              className="chart-bar"
                              style={{ animationDelay: `${(dayIndex * 35) + (categoryIndex * 30)}ms` }}
                              x={x + categoryIndex * 12}
                              y={stackY}
                              width="10"
                              height={height}
                              rx="4"
                              fill={category.color}
                            />
                          ) : null;
                        })}
                        <text className="chart-axis-label" textAnchor="middle" x={x + 24} y="240">{day.date.slice(5)}</text>
                      </g>
                    );
                  })}
                </svg>
                <div className="chart-legend" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
                  {categories.filter((category) => dailyCollection.some((day) => (day[category.key] || 0) > 0)).map((category) => (
                    <div className="legend-row" key={category.key} style={{ justifyContent: 'flex-start' }}><span className="legend-label"><i className="legend-swatch" style={{ background: category.color }} />{category.label}</span></div>
                  ))}
                </div>
              </>
            ) : <div style={{ color: '#64748b', padding: '45px 0' }}>No collection history to chart yet.</div>}
          </div>
        </div>

        <div className="card chart-box" style={{ marginTop: 24 }}>
          <div className="panel-header"><div><h3>Processing stages</h3><small style={{ color: '#64748b' }}>Current location of each recorded item</small></div></div>
          <div className="grid-four">
            {stageRows.map(([stage, count]) => (
              <div className="stage-card" key={stage}>
                <div style={{ color: '#64748b', textTransform: 'capitalize', fontSize: '.8rem' }}>{stage}</div>
                <div className="metric-value">{count}</div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min((count / Math.max(totalItems, 1)) * 100, 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card chart-box" style={{ marginTop: 24 }}>
          <div className="panel-header">
            <h3>Item history</h3>
            <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 180 }}>
              <option value="all">All</option>
              <option value="recyclable">Recyclable</option>
              <option value="reusable">Reusable</option>
              <option value="biodegradable">Biodegradable</option>
              <option value="hazardous">Hazardous</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredItems.length ? filteredItems.map((item) => (
              <div key={item.id} className="event-item">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{item.object_label}</strong>
                  <span className={`badge badge-${item.waste_category === 'review' ? 'review' : item.waste_category}`}>{item.waste_category === 'review' ? 'Needs review' : item.waste_category}</span>
                </div>
                <div>{item.current_stage} • {item.estimated_weight} kg</div>
                <small style={{ color: '#64748b' }}>{new Date(item.detection_timestamp).toLocaleString()}</small>
              </div>
            )) : <div>No items matching this filter.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
