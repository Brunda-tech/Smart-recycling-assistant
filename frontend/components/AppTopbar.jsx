'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Leaf, LogOut } from 'lucide-react';

export default function AppTopbar({ title, subtitle, actions }) {
  const [email, setEmail] = useState('Demo user');

  useEffect(() => {
    setEmail(window.localStorage.getItem('sra-user-email') || 'Demo user');
  }, []);

  function signOut() {
    window.localStorage.removeItem('sra-user-email');
    window.location.assign('/login');
  }

  return (
    <header className="app-topbar">
      <div className="app-topbar-copy">
        {subtitle && <div className="eyebrow">{subtitle}</div>}
        <h1>{title}</h1>
      </div>
      <div className="topbar-tools">
        {actions}
        <div className="topbar-icon" aria-label="Sustainability updates">
          <Bell size={17} />
          <span className="notification-dot" />
        </div>
        <div className="user-chip">
          <span className="user-avatar"><Leaf size={17} /></span>
          <span className="user-details">
            <strong>{email.split('@')[0]}</strong>
            <small>Demo workspace</small>
          </span>
        </div>
        <button className="signout-button" type="button" onClick={signOut} title="Sign out" aria-label="Sign out">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
