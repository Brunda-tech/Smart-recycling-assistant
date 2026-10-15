'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const validateForm = () => {
    if (!form.email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    window.localStorage.setItem('sra-user-email', form.email);
    router.push('/dashboard');
  };

  const handleDemoLogin = () => {
    window.localStorage.setItem('sra-user-email', 'demo@smartrecycling.local');
    router.push('/dashboard');
  };

  return (
    <div className="login-layout">
      <aside className="login-sidebar">
        <div className="sidebar-header">
          <div className="logo-badge">S</div>
          <div><div style={{ fontWeight: 800 }}>Smart Recycling</div><small style={{ color: 'rgba(255,255,255,.7)' }}>Assistant</small></div>
        </div>
        <nav>
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/scanner" className="nav-link">Waste Scanner</a>
          <a href="/digital-twin" className="nav-link">Digital Twin</a>
          <a href="/ai-assistant" className="nav-link">EcoGuide AI</a>
          <a href="/analytics" className="nav-link">Analytics</a>
        </nav>
      </aside>

      <main className="login-main">
        <div className="login-main-top"><span>Welcome to your sustainability workspace</span></div>
        <div className="login-content">
          <section className="login-intro">
            <div className="hero-kicker">A smarter loop starts here</div>
            <h1>Make every material count.</h1>
            <p>Sign in to explore your collection, improve sorting decisions, and follow resources through a circular journey.</p>
            <img className="login-intro-art" src="/recycling-hero.svg" alt="Recycling bins with a green landscape illustration" />
          </section>

          <div className="login-card">
            <div className="sidebar-header" style={{ marginBottom: '24px' }}>
              <div className="logo-badge">S</div>
              <div><div style={{ fontWeight: 800, fontSize: '1.3rem' }}>Smart Recycling Assistant</div><small style={{ color: '#64748b' }}>Demo workspace access</small></div>
            </div>

            <h2 style={{ marginBottom: '8px' }}>Welcome back</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Demo authentication only. This login is for demonstration and not production-grade security.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" className="input" type="email" value={form.email} onChange={handleChange} placeholder="user@smartrecycling.ai" />
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" className="input" type="password" value={form.password} onChange={handleChange} placeholder="••••••" />
              </div>

              {error && <div style={{ color: '#b91c1c', marginBottom: '12px' }}>{error}</div>}

              <button className="btn btn-primary" style={{ width: '100%', marginBottom: '10px' }} type="submit">
                Sign in
              </button>

              <button className="btn btn-secondary" style={{ width: '100%' }} type="button" onClick={handleDemoLogin}>
                Demo Login
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
