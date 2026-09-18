import React, { useState } from 'react';
import { 
  Zap, 
  Menu, 
  X, 
  Globe, 
  Activity, 
  Sliders, 
  Calendar, 
  QrCode, 
  Terminal, 
  CheckCircle2 
} from 'lucide-react';
import { translations } from '../utils/localization';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  lang, 
  setLang, 
  backendConnected,
  scenarioId 
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = translations[lang];

  const navTabs = [
    { id: 'overview', label: t.tabOverview, icon: Activity },
    { id: 'directives', label: t.tabDirectives, icon: Sliders },
    { id: 'schedule', label: t.tabSchedule, icon: Calendar },
    { id: 'passport', label: t.tabPassport, icon: QrCode },
    { id: 'harness', label: t.tabHarness, icon: Terminal },
  ];

  const handleTabClick = (id) => {
    setActiveTab(id);
    setDrawerOpen(false);
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'bn' : 'en'));
  };

  return (
    <header className="nav-header">
      {/* =========================================================
          DESKTOP NAVIGATION (>= 768px) - Sleek Single-Row Bar
          ========================================================= */}
      <div className="desktop-nav">
        {/* Brand */}
        <div className="brand-section" onClick={() => setActiveTab('overview')}>
          <div className="brand-logo-icon">
            <Zap size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="brand-title">{t.brandName}</div>
          </div>
        </div>

        {/* Live Status & Connection Pill */}
        <div className="status-pill">
          <span className="pulse-dot"></span>
          <span>{scenarioId} • {t.liveStatus}</span>
          <span style={{ color: backendConnected ? 'var(--primary-300)' : 'var(--accent-amber)', fontSize: '0.75rem' }}>
            ({backendConnected ? t.connectedBackend : t.backendOffline})
          </span>
        </div>

        {/* Tabs */}
        <div className="nav-tabs-group">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <Icon size={16} strokeWidth={2.2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Language Switcher Pill */}
        <div className="nav-actions-group">
          <button 
            className="lang-toggle-btn"
            onClick={toggleLanguage}
            title="Toggle English / বাংলা"
          >
            <Globe size={16} strokeWidth={2.2} />
            <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          MOBILE NAVIGATION (< 768px) - Strictly 2-Row Design
          ========================================================= */}
      <div className="mobile-nav">
        {/* Row 1: Left 38x38 Hamburger, Center Brand, Right Language Switcher */}
        <div className="mobile-row-1">
          <button 
            className="hamburger-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} strokeWidth={2.4} />
          </button>

          <div className="mobile-brand" onClick={() => setActiveTab('overview')}>
            <div className="brand-logo-icon" style={{ width: 28, height: 28 }}>
              <Zap size={16} strokeWidth={2.4} />
            </div>
            <span>{t.brandName}</span>
          </div>

          <button 
            className="lang-toggle-btn"
            onClick={toggleLanguage}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          >
            <Globe size={14} strokeWidth={2.2} />
            <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>
        </div>

        {/* Row 2: Location & Status Pill Spanning Full Width */}
        <div className="mobile-row-2">
          <div className="mobile-status-pill">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="pulse-dot"></span>
              <span>{scenarioId}</span>
            </div>
            <span>{backendConnected ? t.connectedBackend : t.backendOffline}</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          Slide-Out Gesture Drawer (Mobile Menu)
          ========================================================= */}
      {drawerOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="brand-section">
                <div className="brand-logo-icon" style={{ width: 32, height: 32 }}>
                  <Zap size={18} strokeWidth={2.4} />
                </div>
                <div className="brand-title" style={{ fontSize: '1.2rem' }}>{t.brandName}</div>
              </div>
              <button 
                className="drawer-close-btn"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close Drawer"
              >
                <X size={20} strokeWidth={2.4} />
              </button>
            </div>

            <div className="drawer-links">
              {navTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    className={`drawer-link-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t.brandSubtitle}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
