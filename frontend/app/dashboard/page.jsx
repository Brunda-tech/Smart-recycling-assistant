'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, ArrowUpRight, Recycle, Sparkles, Factory, ScanLine, Activity, Leaf, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import AppTopbar from '@/components/AppTopbar';

const statIcons = {
  total: Activity,
  recyclable: Recycle,
  reusable: ArrowUpRight,
  biodegradable: Leaf,
  hazardous: AlertTriangle,
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_items: 0,
    recyclable: 0,
    reusable: 0,
    biodegradable: 0,
    hazardous: 0,
    total_weight: 0,
    recovery_rate: 0,
    category_counts: {},
  });
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [materialsData, twinData] = await Promise.all([
          api.getMaterials(),
          api.twinSummary(),
        ]);

        const categoryCounts = twinData.category_counts || {};
        setMaterials(materialsData || []);
        setStats({
          total_items: twinData.total_items || (materialsData || []).length,
          recyclable: categoryCounts.recyclable || 0,
          reusable: categoryCounts.reusable || 0,
          biodegradable: categoryCounts.biodegradable || 0,
          hazardous: categoryCounts.hazardous || 0,
          total_weight: twinData.total_weight || 0,
          recovery_rate: twinData.recovery_rate || 0,
          category_counts: categoryCounts,
        });
      } catch (error) {
        console.error('Dashboard load failed', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const chartData = Object.entries(stats.category_counts || {});

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-badge">S</div>
          <div>
            <div style={{ fontWeight: 800 }}>Smart Recycling</div>
            <small style={{ color: 'rgba(255,255,255,0.7)' }}>Assistant</small>
          </div>
        </div>

        <nav>
          <Link href="/dashboard" className="nav-link active"><Activity size={18} /> Dashboard</Link>
          <Link href="/scanner" className="nav-link"><ScanLine size={18} /> Waste Scanner</Link>
          <Link href="/digital-twin" className="nav-link"><Factory size={18} /> Digital Twin</Link>
          <Link href="/ai-assistant" className="nav-link"><Sparkles size={18} /> EcoGuide AI</Link>
          <Link href="/analytics" className="nav-link"><BarChart3 size={18} /> Analytics</Link>
        </nav>
      </aside>

      <main className="main-panel">
        <AppTopbar
          title="Sustainability dashboard"
          subtitle="Operations overview"
          actions={<>
            <button className="btn btn-primary" onClick={() => window.location.href = '/scanner'}>Scan Waste</button>
            <button className="btn btn-secondary" onClick={async () => {
              try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/demo/load`, { method: 'POST' });
                window.location.reload();
              } catch (error) {
                console.error('Could not load demo data', error);
              }
            }}>Load Demo Data</button>
            <button className="btn btn-ghost" onClick={async () => {
              const confirmReset = window.confirm('Reset demo data?');
              if (!confirmReset) return;
              try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/demo/reset`, { method: 'POST' });
                window.location.reload();
              } catch (error) {
                console.error('Could not reset demo data', error);
              }
            }}>Reset Demo Data</button>
          </>}
        />

        <section className="hero-card">
          <div className="hero-copy">
            <div className="hero-kicker">Small actions. Circular impact.</div>
            <h2>Give every material a better next life.</h2>
            <p>Track what you collect, sort with confidence, and turn today’s waste stream into tomorrow’s resources.</p>
            <Link href="/digital-twin" className="btn" style={{ background: 'white', color: '#047857' }}>Explore your facility <ArrowUpRight size={16} style={{ marginLeft: 8 }} /></Link>
          </div>
          <img className="hero-art" src="/recycling-hero.svg" alt="Illustration of recycling bins and a thriving green landscape" />
        </section>

        {loading ? <div>Loading dashboard...</div> : (
          <>
            <div className="grid-three">
              {[
                { key: 'total_items', label: 'Total detected items', value: stats.total_items, icon: Activity },
                { key: 'recyclable', label: 'Recyclable', value: stats.recyclable, icon: Recycle },
                { key: 'reusable', label: 'Reusable', value: stats.reusable, icon: ArrowUpRight },
                { key: 'biodegradable', label: 'Biodegradable', value: stats.biodegradable, icon: Leaf },
                { key: 'hazardous', label: 'Hazardous', value: stats.hazardous, icon: AlertTriangle },
                { key: 'total_weight', label: 'Estimated waste weight (kg)', value: stats.total_weight.toFixed ? stats.total_weight.toFixed(2) : stats.total_weight, icon: BarChart3 },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.key} className="card metric-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="metric-label">{metric.label}</span>
                      <Icon size={18} color="#10b981" />
                    </div>
                    <div className="metric-value">{metric.value}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid-two" style={{ marginTop: '24px' }}>
              <div className="card chart-box">
                <div className="panel-header">
                  <h3>Waste distribution</h3>
                  <span className="badge badge-recyclable">Recovery {stats.recovery_rate}%</span>
                </div>
                <div className="bar-chart">
                  {chartData.length ? chartData.map(([category, count]) => (
                    <div key={category} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '100%' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <div className="bar-segment" style={{ height: `${Math.max((count / Math.max(...chartData.map(([,value]) => value)), 0.08)) * 170}px`, width: '100%' }} />
                        <div style={{ marginTop: '8px', fontSize: '12px', textTransform: 'capitalize' }}>{category}</div>
                      </div>
                    </div>
                  )) : <div>No waste data available yet.</div>}
                </div>
              </div>

              <div className="card chart-box">
                <div className="panel-header">
                  <h3>Material flow</h3>
                  <span className="badge badge-biodegradable">Live</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '20px' }}>
                  {['collection', 'sorting', 'processing', 'recovery'].map((stage, idx) => (
                    <div key={stage}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', textTransform: 'capitalize' }}>
                        <span>{stage}</span>
                        <span>{materials.filter((item) => item.current_stage === stage).length}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${Math.min((materials.filter((item) => item.current_stage === stage).length / Math.max(materials.length, 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid-two" style={{ marginTop: '24px' }}>
              <div className="card chart-box">
                <div className="panel-header">
                  <h3>Recent activity</h3>
                  <Link href="/analytics" style={{ color: '#10b981' }}>View all</Link>
                </div>
                <ul className="table-list">
                  {materials.length ? materials.slice(0, 5).map((item) => (
                    <li key={item.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{item.object_label}</strong>
                        <span className={`badge badge-${item.waste_category}`}>{item.waste_category}</span>
                      </div>
                      <small style={{ color: '#64748b' }}>{item.current_stage} • {new Date(item.detection_timestamp).toLocaleString()}</small>
                    </li>
                  )) : <li>No material records available.</li>}
                </ul>
              </div>

              <div className="card chart-box">
                <div className="panel-header">
                  <h3>Quick links</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link href="/scanner" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>AI Waste Scanner</Link>
                  <Link href="/digital-twin" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>Digital Twin</Link>
                  <Link href="/ai-assistant" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>EcoGuide AI</Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
