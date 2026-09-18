import React from 'react';
import { PhoneCall, Shield, Radio, Activity } from 'lucide-react';
import { translations } from '../utils/localization';

export function Footer({ activeTab, lang }) {
  const t = translations[lang];

  return (
    <footer style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 1.5rem 3rem 1.5rem' }}>
      {/* Emergency Strip (Exclusively on Overview tab) */}
      {activeTab === 'overview' && (
        <div className="emergency-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-300)'
            }}>
              <Radio size={24} className="pulse-dot" style={{ width: 24, height: 24, borderRadius: '50%', background: 'transparent', boxShadow: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                {t.emergencyTitle}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary-200)' }}>
                {t.emergencySubtitle}
              </div>
            </div>
          </div>

          <a href="tel:+8801700000000" className="call-operator-btn">
            <PhoneCall size={18} strokeWidth={2.4} />
            <span>{t.callOperator} (+880 1700-000000)</span>
          </a>
        </div>
      )}

      {/* Clean Minimal Copyright Strip */}
      <div className="footer-section">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            &copy; {new Date().getFullYear()} {t.allRightsReserved}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>
            <Activity size={14} />
            <span>{t.versionInfo}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
